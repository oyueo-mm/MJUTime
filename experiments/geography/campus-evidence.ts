/** Physical register dates are NOT opening ceremonies or changes of occupant.
 * Official PDF, attachment p10, visually checked 2026-10-22; no photo redistribution.
 * No extension/alteration dates were supplied. Historic volume uses CURRENT outline.
 */
export const registerSource='https://ice1.mju.ac.kr/bbs/mjukr/147/146375/download.do'
export const campusRegister=[
  {id:'462990137',name:'종합관 · 구 본관',completed:[1971,8,7],above:10,below:1},
  {id:'462990141',name:'학생회관',completed:[1982,2,17],above:10,below:1},
  {id:'640328305',name:'미래관 · 구 별관',completed:[1982,9,10],above:6,below:1},
  {id:'462990138',name:'국제관 · 구 경상관',completed:[1982,9,10],above:9,below:1},
  {id:'462990140',name:'행정동',completed:[1997,6,27],above:5,below:1},
  {id:'462990139',name:'방목학술정보관',completed:[2010,1,20],above:4,below:3},
  {id:'1127358152',name:'MCC · 교육복합시설',completed:[2021,8,23],above:2,below:2},
] as const
export const registered=(id:string)=>campusRegister.find(b=>b.id===id)
export const physicallyKnown=(id:string,month:number)=>{const b=registered(id);return b?month>=b.completed[0]*12+b.completed[1]-1:false}
export const legacyCampus=campusRegister.slice(0,5)

/** Shapes have their own observation window, independent of building existence.
 * Persistence is a stated reference assumption, not a newly discovered capture.
 * Never carry a field across an unobserved redevelopment or into the MCC period.
 */
export function featureEvidence(id:string,month:number):'observed'|'reference'|'hidden'{
  const exact=id.startsWith('85-')?1985*12+9:2001*12+8
  if(month===exact)return 'observed'
  // Local 1985 unknown roofs/road are not identifiable as surviving structures.
  if(id.startsWith('85-'))return 'hidden'
  // Main and union persistence has independent physical-register evidence.
  if(id==='01-main'||id==='01-union')return 'hidden' // registered current-outline model instead
  // 1997 preview confirms the field, 2001 trace locates it. Last independently
  // dated view here remains 2001: do not claim it survived up to MCC construction.
  if(id==='01-university-field')return month>=1998*12&&month<=2001*12+8?'reference':'hidden'
  if(id==='01-road')return month>=1998*12&&month<=2001*12+8?'reference':'hidden'
  return 'hidden'
}
