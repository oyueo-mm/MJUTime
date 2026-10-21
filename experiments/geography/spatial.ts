import data from './data/current-map.json'
export const mapData=data
export type Point=[number,number]
export function project(lon:number,lat:number):Point {
  return [(lon-data.meta.origin[0])*111320*Math.cos(data.meta.origin[1]*Math.PI/180),-(lat-data.meta.origin[1])*111320]
}
export function inRing([x,y]:number[],ring:number[][]) {
  let result=false
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const [ax,ay]=ring[i],[bx,by]=ring[j]
    if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)result=!result
  }
  return result
}
export function heightAt(x:number,z:number) {
  const t=data.terrain
  const fx=Math.max(0,Math.min(t.cols-1,(x-t.min[0])/(t.max[0]-t.min[0])*(t.cols-1)))
  const fz=Math.max(0,Math.min(t.rows-1,(z-t.min[1])/(t.max[1]-t.min[1])*(t.rows-1)))
  const ix=Math.min(t.cols-2,Math.floor(fx)),iz=Math.min(t.rows-2,Math.floor(fz)),dx=fx-ix,dz=fz-iz
  const at=(i:number,j:number)=>t.heights[j*t.cols+i]
  return (at(ix,iz)*(1-dx)+at(ix+1,iz)*dx)*(1-dz)+(at(ix,iz+1)*(1-dx)+at(ix+1,iz+1)*dx)*dz
}
