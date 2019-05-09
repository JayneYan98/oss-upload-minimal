// 使用 fetch api 进行 graphql 请求， 并返回 promise

const graphql = (queryString) => {
  const headers = {
    'Content-Type': 'application/json',
    'key': window.altizureOss.altikey,
    'altitoken': window.altizureOss.usertoken
  }

  const options = {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: queryString })
  }

  return window.fetch('https://api.altizure.cn/graphql', options)
    .then(res => res.json())
}

export default graphql

/**
 * graphql query
 */

export const getBucket = () => graphql(`
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

export const getSts = ({
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

export const getHasImage = async ({pid, checksum}) => graphql(`
  mutation {
    hasImage(pid: "${pid}", checksum: "${checksum}") {
      id,
      state
      name
      checksum
    }
  }
`)

export const registerUpload = ({
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

export const startUpload = ({id}) => graphql(`
  mutation {
    startImageUpload(id: "${id}") {
      id
      state
    }
  }
`)

export const doneUpload = ({id}) => graphql(`
  mutation {
    doneImageUpload(id: "${id}") {
      id
    }
  }
`)

export const getImagesState = ({id}) => graphql(`
{
  project (id: "${id}") {
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