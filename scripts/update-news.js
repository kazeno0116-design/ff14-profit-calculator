"use strict";

const fs = require("fs");
const path = require("path");

const FEEDS = [
  {
    url: "https://jp.finalfantasyxiv.com/lodestone/news/news.xml",
    source: "NEWS",
  },
  {
    url: "https://jp.finalfantasyxiv.com/lodestone/news/topics.xml",
    source: "TOPIC",
  },
];

const OUTPUT = path.resolve(__dirname, "../assets/data/news.json");
const MAX_ITEMS = 6;

function decodeEntities(text = "") {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function unwrap(value = "") {
  return value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function stripHtml(value = "") {
  return decodeEntities(
    unwrap(value)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function xmlValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? unwrap(match[1]) : "";
}

function detectBadge(title, source) {
  if (/パッチ|Patch/i.test(title)) return "PATCH";
  if (/更新|アップデート|HotFix/i.test(title)) return "UPDATE";
  if (/メンテナンス/i.test(title)) return "MAINT";
  if (/障害|復旧|不具合/i.test(title)) return "INFO";
  return source === "TOPIC" ? "TOPIC" : "NEWS";
}

function summarize(description) {
  const text = stripHtml(description);
  if (!text) return "公式サイトで詳細をご確認ください。";
  return text.length > 150 ? `${text.slice(0, 147)}…` : text;
}

function parseFeed(xml, source) {
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => {
    const block = match[1];
    const title = stripHtml(xmlValue(block, "title"));
    const url = stripHtml(xmlValue(block, "link"));
    const description = xmlValue(block, "description");
    const pubDate = stripHtml(xmlValue(block, "pubDate"));

    return {
      title,
      url,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      source,
      badge: detectBadge(title, source),
      summary: summarize(description),
    };
  }).filter((item) => item.title && item.url);
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      "user-agent": "ff14-personal-tool-portal/1.0",
      "accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`${feed.url}: HTTP ${response.status}`);
  }

  return parseFeed(await response.text(), feed.source);
}

async function main() {
  const settled = await Promise.allSettled(FEEDS.map(fetchFeed));
  const items = settled
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);

  settled
    .filter((result) => result.status === "rejected")
    .forEach((result) => console.warn(result.reason));

  if (!items.length) {
    throw new Error("すべてのRSS取得に失敗したため、news.jsonは更新しません。");
  }

  const unique = [...new Map(items.map((item) => [item.url, item])).values()]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, MAX_ITEMS);

  const output = {
    schemaVersion: 1,
    source: "FINAL FANTASY XIV, The Lodestone",
    generatedAt: new Date().toISOString(),
    items: unique,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(`news.jsonを更新しました: ${unique.length}件`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
