const express = require('express')
const process = require('process');
const { execSync, exec } = require('child_process');
const app = express()
const multer = require('multer');
const os = require('os');
var cors = require('cors')
const fs = require('fs')
const path = require('path')

const output = path.resolve('shared')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('assets'))

app.get('/', async (req, res) => {
  // 获取当前目录路径
  const directoryPath = __dirname;
  const whiteFileList = ['index.html', 'server.js', 'start.bat', '.gitignore', '.gitattributes', 'template.html', 'README.md', 'package.json', 'package-lock.json']
  const whiteFolderList = ['.git', 'node_modules']
  const list = [];

  // 递归读取文件夹下的所有文件
  function readDirSync(dir, list, parentPath = '') {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        if (whiteFolderList.includes(file)) return;
        readDirSync(filePath, list, path.join(parentPath, file));
      } else {
        if (whiteFileList.includes(file)) return;

        // 获取文件大小 格式化为 KB MB GB TB
        let fileSize = stat.size;
        if(fileSize < 1024) {
          fileSize = fileSize + 'B';
        } else if(fileSize < 1024 * 1024) {
          fileSize = (fileSize / 1024).toFixed(2) + 'KB';
        } else if(fileSize < 1024 * 1024 * 1024) {
          fileSize = (fileSize / 1024 / 1024).toFixed(2) + 'MB';
        } else if(fileSize < 1024 * 1024 * 1024 * 1024) {
          fileSize = (fileSize / 1024 / 1024 / 1024).toFixed(2) + 'GB';
        } else {
          fileSize = (fileSize / 1024 / 1024 / 1024 / 1024).toFixed(2) + 'TB';
        }

        list.push({
          path: path.join(parentPath, file),
          size: fileSize,
        });
      }
    });
  }

  readDirSync(directoryPath, list);
  res.json(list);
})


// 配置 multer 中间件
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 指定上传文件保存的目录
    cb(null, output);
  },
  filename: function (req, file, cb) {
    // 指定上传文件的文件名
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.post('/', upload.single('file'), async function (req, res) {
  res.json({ message: '上传成功', data: req.file.originalname });
})

app.get('/device', async (req, res) => {
  // 获取当前服务器的设备信息 磁盘大小  不是docker的
  let cmd = "df -h"
  let result = execSync(cmd, { encoding: 'utf8' }).toString()
  res.send(result)
})


// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err)
})

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err)
})

const PORT = 665;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  let ip = '';
  // 获取本地ip地址
  // 获取本地网络接口列表
  const networkInterfaces = os.networkInterfaces();

  // 遍历网络接口列表，找到IPv4地址
  Object.keys(networkInterfaces).forEach(interfaceName => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach(interfaceInfo => {
      // 找到IPv4地址
      if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
        console.log(`本地 IP 地址为: ${interfaceInfo.address}`);
        if (interfaceInfo.address.startsWith('192.168.')) {
          ip = interfaceInfo.address;
          return
        }
        if (!ip)
          ip = interfaceInfo.address;
      }
    });
  });

  // 读取template.html文件内容
  const templatePath = path.join(__dirname, 'template.html');
  const templateContent = fs.readFileSync(templatePath, 'utf-8');

  // 写入index.html文件
  const indexPath = path.join(__dirname, 'index.html');
  const indexContent = templateContent.replaceAll('localhost', ip)
  fs.writeFileSync(indexPath, indexContent);

  if (!fs.existsSync(output)) {
    fs.mkdirSync(output);
  }

  exec('serve -p 666');
})