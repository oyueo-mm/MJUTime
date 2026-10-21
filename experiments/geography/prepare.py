"""Independent OSM XML + public Terrarium extraction; no reference-site code/data.
Run: python experiments/geography/prepare.py .preview/geo/osm-full.xml .preview/geo
Requires Pillow. Source geometry and OSM IDs retained in the derived ODbL dataset.
"""
import sys, json, math, hashlib, datetime
from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image

source, tiles = Path(sys.argv[1]), Path(sys.argv[2])
dest = Path(__file__).parent / 'data'
dest.mkdir(exist_ok=True)
bounds = [126.916, 37.5735, 126.937, 37.592]
origin = [126.9265, 37.58275]
root = ET.parse(source).getroot()
nodes = {e.get('id'): [float(e.get('lon')), float(e.get('lat'))] for e in root.findall('node')}
ways = {}
def tags(e): return {t.get('k'): t.get('v') for t in e.findall('tag')}
def inside(p): return bounds[0] <= p[0] <= bounds[2] and bounds[1] <= p[1] <= bounds[3]
def xy(p): return [round((p[0]-origin[0])*111320*math.cos(math.radians(origin[1])),2), round(-(p[1]-origin[1])*111320,2)]
def center(ring):
    points = ring[:-1] if ring[0] == ring[-1] else ring
    return [sum(p[i] for p in points)/len(points) for i in (0,1)]
for e in root.findall('way'):
    ring = [nodes[n.get('ref')] for n in e.findall('nd') if n.get('ref') in nodes]
    if ring: ways[e.get('id')] = {'id':e.get('id'), 'ring':ring, 'tags':tags(e)}

def clip(poly):
    for axis, limit, sign in [(0,bounds[0],1),(0,bounds[2],-1),(1,bounds[1],1),(1,bounds[3],-1)]:
        result=[]
        for a,b in zip(poly,poly[1:]+poly[:1]):
            ai,bi = sign*(a[axis]-limit)>=0,sign*(b[axis]-limit)>=0
            if ai: result.append(a)
            if ai != bi:
                t=(limit-a[axis])/(b[axis]-a[axis]);result.append([a[j]+t*(b[j]-a[j]) for j in (0,1)])
        poly=result
        if not poly: break
    return poly

buildings=[]; roads=[]; areas=[]
for w in ways.values():
    t,r=w['tags'],w['ring'];c=center(r)
    if 'building' in t and len(r)>3 and r[0]==r[-1] and inside(c):
        height=None; basis='placeholder'
        try:
            if t.get('height'): height=float(t['height'].replace(' m',''));basis='osm-height'
            elif t.get('building:levels'): height=float(t['building:levels'])*3;basis='levels-times-3m'
        except ValueError: pass
        buildings.append({'id':w['id'],'p':[xy(p) for p in r[:-1]],'center':xy(c),'height':height if height and 1<height<250 else 9,'heightBasis':basis,'name':t.get('name',''),'kind':t['building'],'osmStartDate':t.get('start_date')})
    if 'highway' in t:
        # Retain only connected segments within the bounds; never bridge clipped gaps.
        segment=[]
        for p in r:
            if inside(p): segment.append(xy(p))
            else:
                if len(segment)>1: roads.append({'id':w['id'],'p':segment,'kind':t['highway'],'name':t.get('name','')})
                segment=[]
        if len(segment)>1: roads.append({'id':w['id'],'p':segment,'kind':t['highway'],'name':t.get('name','')})
    if len(r)>3 and r[0]==r[-1] and ('landuse' in t or t.get('natural') in ['wood','scrub','water'] or t.get('leisure') in ['park','pitch']):
        poly=clip(r[:-1])
        if len(poly)>2: areas.append({'id':w['id'],'p':[xy(p) for p in poly],'kind':t.get('natural',t.get('landuse',t.get('leisure'))),'name':t.get('name','')})

site_ids={'university':'462886441','college':'463033395','elementary':'463033889','middle':'463033409','high':'463033408'}
sites=[{'id':key,'osmId':wid,'name':ways[wid]['tags']['name'],'p':[xy(p) for p in ways[wid]['ring'][:-1]],'center':xy(center(ways[wid]['ring']))} for key,wid in site_ids.items()]

# Terrarium R*256 + G + B/256 -32768. Bilinear sampling; z13 is ~15m per pixel here,
# but the underlying SRTM/GMTED resolution is coarser. No vertical exaggeration.
images={}
def elevation(lon,lat):
    x=(lon+180)/360*8192*256;y=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*8192*256
    def sample(px,py):
        tx,ty=int(px)//256,int(py)//256
        if (tx,ty) not in images: images[tx,ty]=Image.open(tiles/f'dem-{tx}-{ty}.png').convert('RGB')
        r,g,b=images[tx,ty].getpixel((int(px)%256,int(py)%256));return r*256+g+b/256-32768
    ix,iy=math.floor(x),math.floor(y);fx,fy=x-ix,y-iy
    return (sample(ix,iy)*(1-fx)+sample(ix+1,iy)*fx)*(1-fy)+(sample(ix,iy+1)*(1-fx)+sample(ix+1,iy+1)*fx)*fy
cols,rows=81,101
heights=[round(elevation(bounds[0]+(bounds[2]-bounds[0])*x/(cols-1),bounds[3]-(bounds[3]-bounds[1])*y/(rows-1)),2) for y in range(rows) for x in range(cols)]
terrain={'cols':cols,'rows':rows,'min':xy([bounds[0],bounds[3]]),'max':xy([bounds[2],bounds[1]]),'heights':heights,'verticalExaggeration':1}
data={'meta':{'origin':origin,'bounds':bounds,'downloadedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'osmApi':'https://api.openstreetmap.org/api/0.6/map?bbox='+','.join(map(str,bounds)),'osmSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'osmLicense':'ODbL-1.0','terrainUrls':[f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/13/6984/{y}.png' for y in [3171,3172]],'terrainAttribution':'Mapzen Terrain Tiles; USGS SRTM/GMTED2010','notes':'Building outlines are OSM observations, not survey or 2026 imagery. Untagged heights use 9m display proxies; levels use assumed 3m. No historical inference from OSM start_date.'},'buildings':buildings,'roads':roads,'areas':areas,'sites':sites,'terrain':terrain}
(dest/'current-map.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print(json.dumps({'buildings':len(buildings),'roads':len(roads),'areas':len(areas),'terrainRange':[min(heights),max(heights)],'heightKnown':sum(b['heightBasis']=='osm-height' for b in buildings),'sites':site_ids}))
