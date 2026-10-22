"""Pixel-level proposal coverage against an independently hand-labelled mask.
This is not building identity accuracy, height accuracy or survey accuracy.
"""
import json,sys
from pathlib import Path
import cv2
import numpy as np
meta=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'));candidates=json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'));truth=cv2.imread(sys.argv[3],cv2.IMREAD_GRAYSCALE)
assert truth is not None and list(reversed(truth.shape))==meta['pixelSize'],'Reference mask dimensions must match image metadata'
assert candidates['coordinateSpace']=='image pixels, NOT RFC7946 GeoJSON','Use pixel candidates, not geographic coordinates'
assert all(f['properties']['imageSha256']==meta['sha256'] for f in candidates['features']),'Candidates refer to a different image'
mask=np.zeros_like(truth)
for f in candidates['features']:cv2.fillPoly(mask,[np.array(f['geometry']['coordinates'][0],dtype=np.int32)],255)
pred,target=mask>0,truth>127;tp=int(np.logical_and(pred,target).sum());fp=int(np.logical_and(pred,~target).sum());fn=int(np.logical_and(~pred,target).sum())
result={'scope':'pixel proposal coverage only; independent manual mask required','truePositivePixels':tp,'falsePositivePixels':fp,'falseNegativePixels':fn,'iou':tp/(tp+fp+fn) if tp+fp+fn else None,'precision':tp/(tp+fp) if tp+fp else None,'recall':tp/(tp+fn) if tp+fn else None,'buildingIdentityAccuracy':None,'heightAccuracy':None,'imageSha256':meta['sha256']}
Path(sys.argv[4]).write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
