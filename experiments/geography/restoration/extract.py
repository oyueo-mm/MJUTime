"""Unsupervised edge proposals only; no building identity or presence inference.
Input: locally acquired, licensed raster + validated image JSON sidecar.
Node CLI enforces source permissions and digest BEFORE launching this worker.
"""
import sys,json,hashlib
from pathlib import Path
import cv2
import numpy as np
image_path,meta_path,out_path=map(Path,sys.argv[1:4])
meta=json.loads(meta_path.read_text(encoding='utf-8'))
assert hashlib.sha256(image_path.read_bytes()).hexdigest()==meta['sha256'],'SHA-256 mismatch'
image=cv2.imread(str(image_path),cv2.IMREAD_GRAYSCALE)
assert image is not None,'Cannot decode raster'
assert list(reversed(image.shape))==meta['pixelSize'],'Pixel dimensions differ from registration'
assert image.size<=100_000_000,'Raster too large; supply an approved local crop and its transform'
blur=cv2.GaussianBlur(image,(5,5),0)
edges=cv2.Canny(blur,50,150)
contours,_=cv2.findContours(edges,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
polygons=[cv2.approxPolyDP(c,0.01*cv2.arcLength(c,True),True).reshape(-1,2).tolist() for c in contours if cv2.contourArea(c)>=25 and cv2.arcLength(c,True)>0]
features=[{'type':'Feature','id':f"{meta['originalId']}-candidate-{i}",'geometry':{'type':'Polygon','coordinates':[p+[p[0]]]},'properties':{'grade':'unverified','kind':'edge-proposal','identity':None,'heightMetres':None,'captureDate':meta['captureDate'],'sourceId':meta['sourceId'],'imageSha256':meta['sha256'],'originalId':meta['originalId'],'coordinateSpace':'image pixels','accuracy':None}} for i,p in enumerate(polygons) if len(p)>=3]
out_path.write_text(json.dumps({'type':'FeatureCollection','coordinateSpace':'image pixels, NOT RFC7946 GeoJSON','method':'Gaussian 5x5 / Canny 50,150 / external contours / >=25 px2 / epsilon 1% perimeter','warning':'Roads, trees and shadows are candidates too. No semantic building accuracy measured.','features':features},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'candidates':len(features),'semanticAccuracy':None}))
