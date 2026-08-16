#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,hashlib,io,json,sys,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DATA_DIR=ROOT/'assets'/'data'; INDEX_PATH=DATA_DIR/'item-index.json'; META_PATH=DATA_DIR/'item-index-meta.json'
ITEM_URL='https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/ja/Item.csv'
CATEGORY_URL='https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/ja/ItemUICategory.csv'

# Historical currencies that the official Lodestone patch notes explicitly state were
# removed from characters. The raw Item.csv keeps historical rows, so they must not
# be exposed as current acquisition-search results.
REMOVED_ITEM_IDS={
    23,24,26,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,
    10308,10309,10310,10311,17833,17834,
}

def fetch_bytes(url):
    req=urllib.request.Request(url,headers={'User-Agent':'ff14-portal-item-index/1.0'})
    with urllib.request.urlopen(req,timeout=90) as res:return res.read()
def parse_csv(data):return list(csv.DictReader(io.StringIO(data.decode('utf-8-sig'))))
def as_int(v,default=0):
    try:return int(v)
    except:return default
def load_existing_count():
    if not INDEX_PATH.exists():return 0
    try:
        d=json.loads(INDEX_PATH.read_text(encoding='utf-8'))
        if not isinstance(d,list):return 0
        # Compare against the same filtered population so adopting a new
        # obsolete-item filter does not trigger the safety stop itself.
        return sum(1 for x in d if isinstance(x,list) and x and as_int(x[0]) not in REMOVED_ITEM_IDS)
    except:return 0

def build_index(item_bytes,category_bytes):
    cats={as_int(r.get('#')):(r.get('Name') or '').strip() for r in parse_csv(category_bytes) if as_int(r.get('#'))>0 and (r.get('Name') or '').strip()}
    rows=parse_csv(item_bytes); index=[]; seen=set(); dups=[]
    for r in rows:
        iid=as_int(r.get('#')); name=(r.get('Name') or r.get('Singular') or '').strip()
        if iid<=0 or not name or iid in REMOVED_ITEM_IDS:continue
        if iid in seen:dups.append(iid);continue
        seen.add(iid)
        cat=cats.get(as_int(r.get('ItemUICategory')),'')
        index.append([iid,name,cat,as_int(r.get('LevelItem')),as_int(r.get('LevelEquip'))])
    index.sort(key=lambda x:x[0])
    if dups:raise RuntimeError(f'Item ID重複を検出: {dups[:20]}')
    if len({x[0] for x in index})!=len(index):raise RuntimeError('生成後のItem IDが一意ではありません')
    if not index:raise RuntimeError('有効な日本語アイテムが0件です')
    return index,len(rows),len(rows)-len(index),cats

def verify_roundtrip(index,item_bytes,category_bytes):
    rebuilt,source_rows,skipped,_=build_index(item_bytes,category_bytes)
    if index!=rebuilt:
        for i,(a,b) in enumerate(zip(index,rebuilt)):
            if a!=b:raise RuntimeError(f'索引不一致 position={i}: stored={a}, source={b}')
        raise RuntimeError(f'索引件数不一致: stored={len(index)}, source={len(rebuilt)}')
    return source_rows,skipped

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--verify-only',action='store_true'); args=ap.parse_args()
    item_bytes=fetch_bytes(ITEM_URL); category_bytes=fetch_bytes(CATEGORY_URL)
    new_index,source_rows,skipped,cats=build_index(item_bytes,category_bytes)
    prev=load_existing_count()
    if prev and len(new_index)<prev:raise RuntimeError(f'安全停止: アイテム件数減少 {prev}->{len(new_index)}。手動確認してください。')
    if args.verify_only:
        if not INDEX_PATH.exists():raise RuntimeError('item-index.json がありません')
        stored=json.loads(INDEX_PATH.read_text(encoding='utf-8')); verify_roundtrip(stored,item_bytes,category_bytes)
        print(f'OK: {len(stored)} items match current Japanese Item.csv + ItemUICategory.csv after obsolete-item filters');return
    DATA_DIR.mkdir(parents=True,exist_ok=True)
    INDEX_PATH.write_text(json.dumps(new_index,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    meta={'item_source':ITEM_URL,'category_source':CATEGORY_URL,'item_source_sha256':hashlib.sha256(item_bytes).hexdigest(),'category_source_sha256':hashlib.sha256(category_bytes).hexdigest(),'source_rows':source_rows,'indexed_items':len(new_index),'skipped_rows':skipped,'filtered_removed_items':len(REMOVED_ITEM_IDS),'filtered_removed_item_ids':sorted(REMOVED_ITEM_IDS),'filter_note':'Officially deleted historical currencies are excluded from the user-facing item search. Legacy/current-held items remain indexed and are labeled in the UI.','min_item_id':new_index[0][0],'max_item_id':new_index[-1][0],'category_count':len(cats),'schema':['id','name_ja','category_ja','item_level','equip_level']}
    META_PATH.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    stored=json.loads(INDEX_PATH.read_text(encoding='utf-8')); verify_roundtrip(stored,item_bytes,category_bytes)
    print(f'Generated and verified {len(new_index)} Japanese item records.')
if __name__=='__main__':
    try:main()
    except Exception as e:print(f'ERROR: {e}',file=sys.stderr);raise
