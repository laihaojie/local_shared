const http = require('http');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const os = require('os');

const server = http.createServer((req, res) => {
  // 解决跨域问题
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // 获取请求方法和请求路径
  const { method, url } = req;
  if (method === "GET" && url === "/") {
    handleGet(req, res)
  }

  if (method === "POST" && url === "/") {
    handlePost(req, res)
  }


});

const PORT = 665;
server.listen(PORT, () => {
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

  const sharedPath = path.join(__dirname, 'shared');
  if (!fs.existsSync(sharedPath)) {
    fs.mkdirSync(sharedPath);
  }

  exec('serve -p 666');
});


function handleGet(req, res) {
  // 获取当前目录路径
  const directoryPath = __dirname;
  const whiteFileList = ['index.html', 'server.js', 'start.bat', '.gitignore', '.gitattributes', 'template.html', 'README.md']
  const whiteFolderList = ['.git']
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
        list.push(path.join(parentPath, file));
      }
    });
  }

  readDirSync(directoryPath, list);

  // 设置响应头并发送文件列表给客户端
  res.writeHead(200, { 'Content-Type': 'application/json' });


  res.end(JSON.stringify(list));

}

function handlePost(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
  });

  req.on('end', () => {
    const boundary = req.headers['content-type'].split('; ')[1].replace('boundary=', '');
    const parts = body.split('--' + boundary).filter(part => part.trim() !== '' && part.trim() !== '--');

    const fileDir = path.join(__dirname, 'shared');

    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir);
    }

    parts.forEach(part => {
      const contentDisposition = part.split('\r\n')[1];
      const content = part.split('\r\n\r\n')[1];
      const fileName = contentDisposition.match(/filename="(.+?)"/)[1];
      const fileContent = content.split('\r\n')[0];


      const filePath =  path.join(fileDir, fileName);
      fs.writeFileSync(filePath, fileContent, 'binary');
    });

    // 返回json数据
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: '上传成功' }));
  });
}