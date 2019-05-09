# 此范例展示如何使用 altizure oss 服务
## 须知：
 #### 使用 oss 前， 必须取得 开发者账号， 应用令牌 (App key) 和 用户令牌 (User token)
 #### 请先阅读文档：https://docs.altizure.cn/zh-hans/upload.html
#
## 此范例使用 window.altizureOss 暂存数据
#### 污染 window object 并不是一個好習慣
#### 本范例只是作为一个简单的演示
#
### 简介：
 - 上传照片前， 需要透过 sha1 checksum 检查照片是否在服务器已经存在 hasImage(pid， checksum)
 - 通过 uploadImageOSS(pid, bucket, filename, type, sha1sum) 获取 STS 令牌及其他上传所需的图像的资料，
     - STS 令牌的有效期只有 1 小时
     - 在 STS 令牌未过期前，不要重复请求令牌。
 - 获取 STS 令牌后，调用 mutation startImageUpload(id) 通知服务器。
 - 使用相应的 STS 令牌把图像上传到 OSS。 （注： 这里使用 aliyun-sdk）
 - 上传完成后调用 mutation doneImageUpload(id) 通知服务器。
#
### 代码构成
 - 与 aliyun-sdk 相关的代码， 在 src/oss.js
 - 读取本地相片 / 取得 sts / 与 altizure 服务器相关的操作，参考 src/read-and-upload.js
 - 如果项目并不使用 apollo, 可参考 src/graphql.js, 直接使用 fetch api 请求
 - 关于 checksum 的检查， 可参考 src/sha1sum.js
 - UI 相关部分 在 /index.js
#
### 如何运行范例
###### 注意： 请先安装npm和yarn
######  执行命令
```javascript
yarn; // 安装dependency
yarn dev; // 运行 dev server, 默认接口1234， 网页会自行打开
```
###### 或使用
```javascript
yarn; // 安装dependency
yarn build; // build bundle
```
###### 然后打开 dist/index.html
###### 详细可参考： https://parceljs.org/cli.html
