"""Manual roof-centre affine fit. Inputs in 1100px-wide public previews.
Not orthorectification: relief, roof parallax and manual identity remain uncertain.
No source photographs are shipped. Run with Python + numpy.
"""
import json, hashlib
from pathlib import Path
import numpy as np

ROOT=Path(__file__).parent
current=json.loads((ROOT/'data/current-map.json').read_text(encoding='utf-8'))
points={b['id']:b['center'] for b in current['buildings']}
jobs=[
 (1997,10,13,'2762727','199710A0302',25,12,[('462990137',[272,627]),('462990141',[337,620]),('640328305',[195,632]),('462990138',[366,575]),('462990140',[420,608]),('463033408',[651,292]),('463033409',[594,244])]),
 (2006,11,29,'2748690','200611A0302',25,12,[('462990137',[293,614]),('462990141',[365,610]),('640328305',[208,628]),('462990138',[397,563]),('462990140',[425,615])]),
 (2016,10,11,'2700585','201606A0101',26,14,[('462990137',[980,519]),('462990141',[1030,515]),('640328305',[918,521]),('462990138',[1040,476]),('462990142',[976,477])]),
]
out={'method':'manual-affine roof centres, 1100px preview width; present OSM correspondences inferred; not orthorectified or survey accuracy','records':[]}
for year,month,day,obj,zone,course,number,gcps in jobs:
 xy=np.array([p for _,p in gcps]); world=np.array([points[id] for id,_ in gcps]); X=np.c_[xy,np.ones(len(xy))]
 matrix=np.linalg.lstsq(X,world,rcond=None)[0]; errors=np.linalg.norm(X@matrix-world,axis=1); loo=[]
 for i in range(len(X)):
  keep=np.arange(len(X))!=i; m=np.linalg.lstsq(X[keep],world[keep],rcond=None)[0]; loo.append(float(np.linalg.norm(X[i]@m-world[i])))
 raw=ROOT.parent.parent/'.preview/geo'/f'browser-aerial-{year}.jpg'
 out['records'].append({'year':year,'month':month,'day':day,'dateEvidence':'date printed on image margin, manually read','objectId':obj,'zone':zone,'course':course,'number':number,'imageSha256':hashlib.sha256(raw.read_bytes()).hexdigest() if raw.exists() else None,'matrix':matrix.tolist(),'gcps':[{'osmId':id,'pixel':p,'world':points[id]} for id,p in gcps],'fitRmsMetres':float(np.sqrt(np.mean(errors**2))),'leaveOneOutMaxMetres':max(loo),'sourceUrl':'https://map.ngii.go.kr/ms/map/Aerial.do'})
 print(year,'fit RMS',round(out['records'][-1]['fitRmsMetres'],2),'LOO max',round(max(loo),2))
(ROOT/'data/additional-registration.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
