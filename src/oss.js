import 'aliyun-sdk/dist/aliyun-sdk'

/**
 * 使用 aliyun sdk
 * 并输入从 altizure api 返回的 key 和 token, 再进行上传
 * 详细请参考 https://help.aliyun.com/document_detail/31947.html
 */

class OSSUploader {
  constructor (config) {
    this.oss = new window.ALY.OSS({
      accessKeyId: config.sts.id,
      secretAccessKey: config.sts.secret,
      securityToken: config.sts.token,
      endpoint: config.endpoint,
      apiVersion: '2013-10-15'
    })

    this.config = config
  }

  upload = (options) => {
    options.key.replace(new RegExp('^/'), '')

    this.uploadFile(options, (err, res) => {
      if (err) options.onerror(err)
      else options.oncomplete(res)
    })
  }

  uploadFile = (options, callback) => {
    const { chunks, file } = options

    const params = {
      Bucket: this.config.bucket,
      Key: options.key,
      Body: chunks[0],
      ContentType: file.type || '',
      ...options.headers
    }

    this.oss.putObject(params, callback)
  }
}

// 返回一个的 upload function, 执行会返回 promise 并进行上传

const getUpload = sts => {
  const ossUpload = new OSSUploader({
    bucket: sts.bucket,
    endpoint: sts.endpoint,
    sts
  })

  const upload = ({
    key, file, chunks,
    maxRetry = 5
  }) => {
    return new Promise((resolve, reject) => {
      ossUpload.upload({
        file,
        chunks,
        key,
        maxRetry,
        oncomplete: resolve,
        onerror: reject
      })
    })
  }

  return upload
}

export default getUpload
