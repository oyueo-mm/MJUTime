"""Reproduce LOCAL affine trials; Python + numpy. No images redistributed.
Pixels refer to previews resized to width 1100 (height 1034 / 1182).
Roof-centre correspondences are approximate, NOT survey control / orthophotos.
"""
import json
from pathlib import Path
import numpy as np

base = Path(__file__).parent
controls_2001 = [
    [304.5,833.75,-348.97,281.48], [368,816,-271.61,268.89],
    [431,420,-150.13,-210.81], [431,382,-145.02,-256.04],
    [627,431,85.09,-173.89], [571.5,385,28.7,-220.05],
]
# Two recognizable roof groups, eight corners: local cross-date check only.
controls_1985 = [
    [621,682,590,406], [635,671,602,398], [699,745,662,462], [686,757,651,471],
    [224,604,222,354], [245,613,240,362], [212,683,211,433], [192,675,195,427],
]
def fit(controls):
    a=np.array(controls,float); x=np.c_[a[:,:2],np.ones(len(a))]; y=a[:,2:]
    matrix=np.linalg.lstsq(x,y,rcond=None)[0]
    errors=np.linalg.norm(x@matrix-y,axis=1)
    loo=[float(np.linalg.norm(x[i]@np.linalg.lstsq(np.delete(x,i,0),np.delete(y,i,0),rcond=None)[0]-y[i])) for i in range(len(x))]
    return dict(controls=controls,matrix=matrix.tolist(),rms=float(np.sqrt(np.mean(errors**2))),leaveOneOut=loo)

result={'2001':fit(controls_2001),'1985':fit(controls_1985)}
result['2001']['osmControlIds']=['462990137','462990141','795977922','1123968177','463033408','463033409']
result['2001']['frame']={'objectId':2729075,'dateReadFromFrame':'2001-09-13','zone':'200109A0301','course':25,'photo':12,'previewSize':[1100,1182]}
result['1985']['frame']={'objectId':2662182,'dateReadFromFrame':'1985-10-21','zone':'198510A0302','course':21,'photo':6,'previewSize':[1100,1034]}
result['2001']['units']='local metres; current OSM roof centres'
result['1985']['units']='2001 preview pixels; correlated corners on two roofs'
result['warning']='Provisional local affine; no camera calibration, independent survey points, relief/parallax correction or historical DEM. Do not extrapolate across the city. 25m is a caution buffer, NOT a confidence bound.'
(base/'data/aerial-registration.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print('2001 RMS metres:',result['2001']['rms'],'LOO max:',max(result['2001']['leaveOneOut']))
print('1985 RMS pixels:',result['1985']['rms'],'LOO max:',max(result['1985']['leaveOneOut']))
