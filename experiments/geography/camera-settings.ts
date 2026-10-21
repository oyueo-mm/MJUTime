export const defaults={rotate:.5,pan:.5,zoom:.5,move:.5}
export type CameraSettings=typeof defaults
export function sanitizeSettings(raw:Partial<CameraSettings>):CameraSettings{
  const result={...defaults}
  for(const key of Object.keys(defaults) as (keyof CameraSettings)[]){const v=raw[key];if(typeof v==='number'&&Number.isFinite(v))result[key]=Math.max(.1,Math.min(1.5,v))}
  return result
}
export function movementSpeed(distance:number,sensitivity:number,fast=false,precise=false){return Math.max(8,Math.min(500,distance*.45))*sensitivity*(precise?.2:fast?2.5:1)}
