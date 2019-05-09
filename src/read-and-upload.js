import moment from 'moment'
import getUpload from './oss'
import { getBucket, getHasImage, getSts, registerUpload, startUpload, doneUpload } from './graphql'
import sha1sum from './sha1sum'

/**
 * 如果目前没有 sts 或 已经过期,
 * 会对 altizure 进行请求，
 * 返回能使用的sts，
 * 或返回还未过期的 sts 
 */

const getValidSts = async (pid) => {
  const stsCached = window.altizureOss.sts
  const bucket = window.altizureOss.bucket

  if (!stsCached || moment().add(30, 'minutes').isAfter(stsCached.expire)) {
    const { data: { uploadImageOSS: { sts } } } = await getSts({pid, bucket})
    window.altizureOss.sts = sts
    return { sts, refresh: true }
  }
  return { sts: stsCached }
}

/**
 * 返回 sts 还未过期的upload function
 * 或根据新的 sts 产生一个能使用的upload function， 并返回
 */

const getValidUpload = async (pid) => {
  let bucket = window.altizureOss.bucket
  if (!bucket) {
    const { data: { getGeoIPInfo: { nearestBuckets } } } = await getBucket()
    bucket = nearestBuckets[0].bucket
    window.altizureOss.bucket = bucket
  }

  const { sts, refresh } = await getValidSts(pid)
  if (refresh) window.altizureOss.upload = getUpload(sts)
  return window.altizureOss.upload
}

/**
 * 1. 取得 checksum 并检查 图片在不在服务器
 * 2. 取得 sts 有效的 upload function
 * 3. 告诉 altizure  开始上传
 * 4. 通过 aliyun-sdk 进行上传
 * 5. 告诉 altizure 已经完成上传
 */

const onFileLoaded = async ({file, chunk}) => {
  const pid = window.altizureOss.pid
  const { name, type } = file

  const checksum = sha1sum(chunk)
  const { data: {hasImage} } = await getHasImage({pid, checksum})

  if (hasImage) return

  const upload = await getValidUpload(pid)

  const { data: { uploadImageOSS: {image: {id, filename}} } } = await registerUpload({
    pid,
    bucket: window.altizureOss.bucket,
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

  const asyncRead = (file) => new Promise((resolve) => {
    const reader = new window.FileReader()
    
    reader.onload = e => resolve(reader.result)

    reader.readAsArrayBuffer(file)
  })


  for (let i = 0; i < files.length; i += 1) {
    await asyncRead(files[i])
      .then(chunk => onFileLoaded({chunk, file: files[i]}))
      .then(() => {
        callback({
          uploaded: i + 1,
          max: files.length
        })   
      })
  }
}

export default readFiles
