// Read-only public geographic data. Please retain a descriptive User-Agent.
import {mkdir,writeFile} from 'node:fs/promises'
const directory='.preview/geo'
await mkdir(directory,{recursive:true})
const url='https://api.openstreetmap.org/api/0.6/map?bbox=126.916,37.5735,126.937,37.592'
const response=await fetch(url,{headers:{'User-Agent':'MJUTime-geography-research/0.1 (https://github.com/oyueo-mm/MJUTime)'},signal:AbortSignal.timeout(90000)})
if(!response.ok)throw new Error(`OSM ${response.status}; respect rate limits before retrying`)
await writeFile(`${directory}/osm-full.xml`,await response.text())
for(const y of [3171,3172]){
  const response=await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/13/6984/${y}.png`)
  if(!response.ok)throw new Error(`Terrain ${response.status}`)
  await writeFile(`${directory}/dem-6984-${y}.png`,Buffer.from(await response.arrayBuffer()))
}
console.log('Downloaded OSM extract and two public terrain tiles to ignored local files.')
