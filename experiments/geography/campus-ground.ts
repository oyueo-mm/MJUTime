import {heightAt,inRing} from './spatial'
import {photoFeatures,worldRing} from './historical-geometry'
export const fieldRing=worldRing(photoFeatures.find(f=>f.id==='06-field')!)
export const fieldElevation=heightAt(-350,355)+.25
export const fieldReferenceAt=(month:number)=>month>=2001*12+8&&month<=2016*12+9
/** A level athletic surface is a model assumption, tied to observed footprint.
 * Absolute elevation is a DEM proxy, not a measured historic platform.
 */
export function historicalGround(x:number,z:number,field:boolean){return field&&inRing([x,z],fieldRing)?fieldElevation:heightAt(x,z)}
