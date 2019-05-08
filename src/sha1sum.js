import crypto from 'crypto-js'
import sha1 from 'crypto-js/sha1'

// 接受 1 个 文件的 ArrayBuffer， 并通过 crypto.js 返回 sha1 值

export default (fileBinary) => {
  const wordArray = crypto.lib.WordArray.create(fileBinary)
  return sha1(wordArray).toString()
}
