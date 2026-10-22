import {defineConfig} from 'vite'
export default defineConfig({base:'/MJUTime/',server:{host:'127.0.0.1',port:4188,strictPort:true},build:{outDir:'.preview/geography-dist',emptyOutDir:true,rollupOptions:{input:['geography.html','restoration.html']}}})
