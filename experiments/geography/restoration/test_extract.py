"""Synthetic fixtures only. These do not measure real aerial building accuracy."""
import unittest,tempfile,subprocess,sys,json,hashlib
from pathlib import Path
import cv2
import numpy as np
worker=Path(__file__).with_name('extract.py')
def run_image(image,size=None):
 with tempfile.TemporaryDirectory() as d:
  p=Path(d);cv2.imwrite(str(p/'owned.png'),image);meta={'sha256':hashlib.sha256((p/'owned.png').read_bytes()).hexdigest(),'pixelSize':size or list(reversed(image.shape)),'originalId':'synthetic','sourceId':'own-test','captureDate':'2006-11-29'};(p/'meta.json').write_text(json.dumps(meta));r=subprocess.run([sys.executable,str(worker),str(p/'owned.png'),str(p/'meta.json'),str(p/'out.json')],capture_output=True,text=True);return r,json.loads((p/'out.json').read_text()) if (p/'out.json').exists() else None
class ExtractionTests(unittest.TestCase):
 def test_rectangle(self):
  image=np.zeros((256,256),dtype=np.uint8);cv2.rectangle(image,(40,50),(200,180),255,-1);r,data=run_image(image);self.assertEqual(r.returncode,0,r.stderr);self.assertGreater(len(data['features']),0);self.assertTrue(all(f['properties']['grade']=='unverified' and f['properties']['identity'] is None for f in data['features']));mask=np.zeros_like(image);cv2.fillPoly(mask,[np.array(f['geometry']['coordinates'][0],dtype=np.int32) for f in data['features']],255);iou=np.logical_and(mask,image).sum()/np.logical_or(mask,image).sum();self.assertGreater(iou,.95)
 def test_blank(self):
  r,data=run_image(np.zeros((64,64),dtype=np.uint8));self.assertEqual(r.returncode,0,r.stderr);self.assertEqual(data['features'],[])
 def test_wrong_size(self):
  r,data=run_image(np.zeros((64,64),dtype=np.uint8),[128,128]);self.assertNotEqual(r.returncode,0);self.assertIsNone(data)
if __name__=='__main__':unittest.main()
