// 使用 fetch api 进行 graphql 请求， 并返回 promise

const graphql = (queryString) => {
  const headers = {
    'Content-Type': 'application/json',
    'key': window.altikey,
    'altitoken': window.altitoken
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
