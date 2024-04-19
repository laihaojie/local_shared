const http = require('http');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const server = http.createServer((req, res) => {
  // 解决跨域问题
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // 获取当前目录路径
  const directoryPath = __dirname;
  const whiteFileList = ['index.html', 'server.js', 'start.bat','.gitignore', '.gitattributes']
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

});

const PORT = 665;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  exec('serve -p 666');
});
