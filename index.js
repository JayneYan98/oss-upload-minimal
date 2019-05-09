import './index.css'
import readFilesAndUpload from './src/read-and-upload'
import { getImagesState } from './src/graphql'

// initialize
window.altizureOss = {
  pid: process.env.PID || '',
  usertoken: process.env.TOKEN || '',
  altikey: process.env.KEY || ''
}

/**
 * Progress bar
 */

const progress = document.getElementById('progress')
const showProgress = ({uploaded, max}) => {
  progress.value = uploaded
  progress.max = max
}

/**
 * Input relevants
 */

const reader = document.getElementById('file-reader')
reader.onchange = (e) => readFilesAndUpload(e, showProgress)


const inputPid = document.getElementById('input-pid')
inputPid.onchange = (e) => { window.altizureOss.pid = e.target.value }
inputPid.value = window.altizureOss.pid

const inputKey = document.getElementById('input-key')
inputKey.onchange = (e) => { window.altizureOss.altikey = e.target.value }
inputKey.value = window.altizureOss.altikey

const inputToken = document.getElementById('input-token')
inputToken.onchange = (e) => { window.altizureOss.usertoken = e.target.value }
inputToken.value = window.altizureOss.usertoken

/**
 * Print images state tables
 */

const print = (arr) => {
  let str = arr.map((obj) => {
    let temp = ''
    for (let k in obj) temp += `${k}: ${obj[k]} | `
    return temp
  }).join('\n')
  
  document.getElementById('table').innerHTML = str || 'no images'
}

const logButton = document.getElementById('query-and-log')
logButton.onclick = () => {
  getImagesState({id: window.altizureOss.pid})
    .then((res) => {
      try {
        const edges = res.data.project.allImages.edges
        const arr = edges.map(edge => edge.node)
        console.table(arr)
        print(arr)
      } catch (e) {
        console.log(res)
      }
    })
}
