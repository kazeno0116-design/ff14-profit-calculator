#!/usr/bin/env python3
from __future__ import annotations
import argparse,csv,hashlib,io,json,sys,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA_DIR=ROOT/'assets'/'data'
ITEM_INDEX=DATA_DIR/'item-index.json'
INDEX_PATH=DATA_DIR/'fishing-index.json'
META_PATH=DATA_DIR/'fishing-index-meta.json'
BASE='https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/ja/'
URLS={
 'FishParameter':BASE+'FishParameter.csv',
 'FishingSpot':BASE+'FishingSpot.csv',
 'TerritoryType':BASE+'TerritoryType.csv',
 'PlaceName':BASE+'PlaceName.csv',
}

def fetch_bytes(url):
    req=urllib.request.Request(url,headers={'User-Agent':'ff14-portal-fishing-index/1.0'})
    with urllib.request.urlopen(req,timeout=90) as res:return res.read()
def read_local(path):return Path(path).read_bytes()
def parse_csv(data):return list(csv.DictReader(io.StringIO(data.decode('utf-8-sig'))))
def as_int(v,default=0):
    try:return int(v)
    except:return default

def load_sources(source_dir=None):
    out={}
    for key,url in URLS.items():
        if source_dir:
            p=Path(source_dir)/(key+'.csv')
            if not p.exists():raise RuntimeError(f'ローカル検証用CSVがありません: {p}')
            out[key]=read_local(p)
        else:out[key]=fetch_bytes(url)
    return out

def load_item_names():
    if not ITEM_INDEX.exists():raise RuntimeError('item-index.json がありません。先に update_item_index.py を実行してください。')
    rows=json.loads(ITEM_INDEX.read_text(encoding='utf-8'))
    return {as_int(r[0]):str(r[1]) for r in rows if isinstance(r,list) and len(r)>=2 and as_int(r[0])>0 and str(r[1]).strip()}

def build_index(src):
    names=load_item_names()
    place={as_int(r.get('#')):(r.get('Name') or '').strip() for r in parse_csv(src['PlaceName'])}
    territory={as_int(r.get('#')):r for r in parse_csv(src['TerritoryType'])}
    spots={as_int(r.get('#')):r for r in parse_csv(src['FishingSpot'])}
    fish_rows=parse_csv(src['FishParameter'])
    result=[]; seen=set(); missing_name=[]
    for r in fish_rows:
        iid=as_int(r.get('Item'))
        if iid<=0:continue
        name=names.get(iid,'').strip()
        if not name:
            missing_name.append(iid);continue
        if iid in seen:raise RuntimeError(f'FishParameterで同一Item IDが重複しています: {iid}')
        seen.add(iid)
        spot_id=as_int(r.get('FishingSpot'))
        level='';area='';spot_name='特殊コンテンツ／通常釣り場データなし' if spot_id<=0 else ''
        if spot_id>0 and spot_id in spots:
            s=spots[spot_id]
            gl=as_int(s.get('GatheringLevel'))
            # プレイヤー向け通常Lvとして意味がある1～100のみ表示する。
            if 1<=gl<=100:level=str(gl)
            spot_name=place.get(as_int(s.get('PlaceName')),'')
            terr=territory.get(as_int(s.get('TerritoryType')),{})
            area=place.get(as_int(terr.get('PlaceName')),'') if terr else ''
        result.append({
            'id':iid,'name':name,'level':level,'area':area,'spot':spot_name,
            'text':(r.get('Text') or '').strip()
        })
    result.sort(key=lambda x:x['id'])
    if not result:raise RuntimeError('魚索引が0件です')
    if len({x['id'] for x in result})!=len(result):raise RuntimeError('魚索引のItem IDが一意ではありません')
    # Item側に名称があるFishParameterは100%索引に入ることを保証。
    expected=[]
    for r in fish_rows:
        iid=as_int(r.get('Item'))
        if iid>0 and names.get(iid,'').strip():expected.append(iid)
    expected=set(expected); actual={x['id'] for x in result}
    if actual!=expected:
        raise RuntimeError(f'魚索引カバレッジ不一致 missing={sorted(expected-actual)[:20]} extra={sorted(actual-expected)[:20]}')
    return result,len(fish_rows),len(expected),sorted(set(missing_name))

def load_existing_count():
    if not INDEX_PATH.exists():return 0
    try:
        d=json.loads(INDEX_PATH.read_text(encoding='utf-8'));return len(d) if isinstance(d,list) else 0
    except:return 0

def verify(index,src):
    rebuilt,source_rows,expected,missing=build_index(src)
    if index!=rebuilt:
        for i in range(min(len(index),len(rebuilt))):
            if index[i]!=rebuilt[i]:raise RuntimeError(f'魚索引不一致 position={i}: stored={index[i]}, source={rebuilt[i]}')
        raise RuntimeError(f'魚索引件数不一致 stored={len(index)} source={len(rebuilt)}')
    return source_rows,expected,missing

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--verify-only',action='store_true')
    ap.add_argument('--source-dir',help='ローカルCSVで検証するときのみ使用')
    args=ap.parse_args()
    src=load_sources(args.source_dir)
    new_index,source_rows,expected,missing=build_index(src)
    prev=load_existing_count()
    if prev and len(new_index)<prev:raise RuntimeError(f'安全停止: 魚件数減少 {prev}->{len(new_index)}。手動確認してください。')
    if args.verify_only:
        if not INDEX_PATH.exists():raise RuntimeError('fishing-index.json がありません')
        stored=json.loads(INDEX_PATH.read_text(encoding='utf-8'))
        verify(stored,src)
        print(f'OK: {len(stored)} Japanese fish records exactly match current FishParameter relationships')
        return
    DATA_DIR.mkdir(parents=True,exist_ok=True)
    INDEX_PATH.write_text(json.dumps(new_index,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    meta={
      'sources':URLS,
      'source_sha256':{k:hashlib.sha256(v).hexdigest() for k,v in src.items()},
      'fishparameter_rows':source_rows,
      'indexed_fish':len(new_index),
      'fishparameter_with_japanese_item_name':expected,
      'fishparameter_without_japanese_item_name':len(missing),
      'unindexed_internal_item_ids':missing,
      'schema':['id','name_ja','fishing_spot_level','area_ja','fishing_spot_ja','description_ja']
    }
    META_PATH.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    stored=json.loads(INDEX_PATH.read_text(encoding='utf-8'));verify(stored,src)
    print(f'Generated and verified {len(new_index)} Japanese fish records.')

if __name__=='__main__':
    try:main()
    except Exception as e:print(f'ERROR: {e}',file=sys.stderr);raise
