import moment from 'moment'
import getUpload from './oss'
import graphql from './graphql'
import sha1sum from './sha1sum'

let state = {}

/**
 * graphql query
 */

const getBucket = () => graphql(`
  {
    getGeoIPInfo {
      id
      nearestBuckets {
        bucket
        display
        cloud
      }
    }
  }
`)

const getSts = ({
  pid,
  bucket,
  filename = '""',
  type = 'JPEG'
}) => graphql(`
  mutation {
    uploadImageOSS(pid: "${pid}", bucket: ${bucket}, filename: ${filename}, type: ${type}) {
      sts {
        id
        secret
        token
        bucket
        endpoint
        expire
      }
    }
  }
`)

const getHasImage = async ({pid, checksum}) => graphql(`
  mutation {
    hasImage(pid: "${pid}", checksum: "${checksum}") {
      id,
      state
      name
      checksum
    }
  }
`)

const registerUpload = ({
  pid,
  bucket,
  filename,
  checksum,
  type
}) => {
  const _type = type.split('/')[1].toUpperCase()
  return graphql(`
    mutation {
      uploadImageOSS(pid: "${pid}", bucket: ${bucket}, filename: "${filename}", type: ${_type}, checksum: "${checksum}") {
        image {
          id
          filename
        }
      }
    }
  `)
}

const startUpload = ({id}) => graphql(`
  mutation {
    startImageUpload(id: "${id}") {
      id
      state
    }
  }
`)

const doneUpload = ({id}) => graphql(`
  mutation {
    doneImageUpload(id: "${id}") {
      id
    }
  }
`)

/**
 * 如果目前没有 sts 或 已经过期,
 * 会对 altizure 进行请求，
 * 返回能使用的sts，
 * 或返回还未过期的 sts 
 */

const getValidSts = async (pid) => {
  const stsCached = state.sts
  const bucket = state.bucket

  if (!stsCached || moment().add(30, 'minutes').isAfter(stsCached.expire)) {
    const { data: { uploadImageOSS: { sts } } } = await getSts({pid, bucket})
    state.sts = sts
    return { sts, refresh: true }
  }
  return { sts: stsCached }
}

/**
 * 返回 sts 还未过期的upload function
 * 或根据新的 sts 产生一个能使用的upload function， 并返回
 */

const getValidUpload = async (pid) => {
  let bucket = state.bucket
  if (!bucket) {
    const { data: { getGeoIPInfo: { nearestBuckets } } } = await getBucket()
    bucket = nearestBuckets[0].bucket
    state.bucket = bucket
  }

  const { sts, refresh } = await getValidSts(pid)
  if (refresh) state.upload = getUpload(sts)
  return state.upload
}

/**
 * 1. 取得 checksum 并检查 图片在不在服务器
 * 2. 取得 sts 有效的 upload function
 * 3. 告诉 altizure  开始上传
 * 4. 通过 aliyun-sdk 进行上传
 * 5. 告诉 altizure 已经完成上传
 */

const onFileLoaded = async ({file, chunk}) => {
  const pid = window.altipid
  const { name, type } = file

  const checksum = sha1sum(chunk)
  const { data: {hasImage} } = await getHasImage({pid, checksum})

  if (hasImage) return

  const upload = await getValidUpload(pid)

  const { data: { uploadImageOSS: {image: {id, filename}} } } = await registerUpload({
    pid,
    bucket: state.bucket,
    filename: name,
    checksum,
    type
  })

  await startUpload({id})

  await upload({
    chunks: [chunk],
    file,
    key: `${pid}/${filename}`,
    maxRetry: 5
  })

  await doneUpload({id})
}

/**
 * 使用 input type="file" 和 FileRead 读取 文件
 * 并通过 FileReader.readAsArrayBuffer 取得 data,
 * 然后执行 callback 进行上传
 */

const readFiles = async (e, callback) => {
  const files = e.target.files
  let reading = []

  const asyncRead = (file) => new Promise((resolve, reject) => {
    reading.push({resolve, reject})

    const reader = new window.FileReader()
    reader.onload = e => {
      const res = reader.result
      const p = reading[0]
      reading = reading.slice(1)
      p.resolve(res)
    }
    reader.readAsArrayBuffer(file)
  })


  let counter = 0
  for (let i = 0; i < files.length; i += 1) {
    await asyncRead(files[i])
    .then(chunk => onFileLoaded({chunk, file: files[i]}))
    .then(() => {
      counter++
      callback({
        uploaded: counter,
        max: files.length - 1
      })   
    })
  }
}

export default readFiles
