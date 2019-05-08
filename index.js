import './index.css'
import readFilesAndUpload from './src/upload'
import graphql from './src/graphql'

const defaultPid = ''
const defaultToken = ''
const defaultKey = ''

window.altipid = defaultPid
window.altitoken = defaultToken
window.altikey = defaultKey

const progress = document.getElementById('progress')
const showProgress = ({uploaded, max}) => {
  progress.value = uploaded
  progress.max = max
}

const reader = document.getElementById('file-reader')
reader.onchange = (e) => readFilesAndUpload(e, showProgress)

const inputPid = document.getElementById('input-pid')
inputPid.onchange = (e) => { window.altipid = e.target.value.trim() }
inputPid.value = defaultPid

const inputKey = document.getElementById('input-key')
inputKey.onchange = (e) => { window.altikey = e.target.value.trim() }
inputKey.value = defaultKey

const inputToken = document.getElementById('input-token')
inputToken.onchange = (e) => { window.altitoken = e.target.value.trim() }
inputToken.value = defaultToken

const logButton = document.getElementById('query-and-log')
logButton.onclick = () => {
  graphql(`
    {
      project (id: "${window.altipid || defaultPid}") {
        allImages(filter: All) {
          totalCount
          edges {
            node {
              name
              state
              error
              checksum
            }
          }
        }
      }
    }
  `)
    .then(({data}) => {
      const edges = data.project.allImages.edges
      console.table(edges.map(edge => edge.node))
    })
}