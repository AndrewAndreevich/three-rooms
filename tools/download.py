# Downloads rooms from superspl.at's CDN into raw/<id>/: python tools/download.py <id>:<lod levels, e.g. 0,1 | flat> ...
import json, os, sys, urllib.request, gzip
base = 'https://d28zzqy0iyovbz.cloudfront.net/%s/v1/'
def get(url, out):
    if os.path.exists(out): return
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    req = urllib.request.Request(url, headers={'Accept-Encoding': 'gzip'})
    data = urllib.request.urlopen(req).read()
    if data[:2] == b'\x1f\x8b': data = gzip.decompress(data)
    open(out, 'wb').write(data)
def sog(id, rel):   # rel = 'x/meta.json' or 'meta.json'
    get(base % id + rel, f'{id}/{rel}')
    m = json.load(open(f'{id}/{rel}', encoding='utf-8'))
    d = os.path.dirname(rel)
    for k, v in m.items():
        if isinstance(v, dict) and 'files' in v:
            for f in v['files']: get(base % id + (d + '/' if d else '') + f, f'{id}/{d}/{f}' if d else f'{id}/{f}')
for arg in sys.argv[1:]:
    id, lv = arg.split(':')
    if lv == 'flat': sog(id, 'meta.json'); continue
    m = json.load(open(f'{id}/lod-meta.json', encoding='utf-8'))
    for fn in m['filenames']:
        if fn.split('_')[0] in lv.split(','): sog(id, fn)
    print(id, 'done')
