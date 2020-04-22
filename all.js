const path = require('path');
const fs = require('fs');

const dirName = __dirname;

let handleImages={//找出项目中未用到的图片
  init:function() {
    console.log('开始搜寻未使用到的图片，请耐心等待······');
    const imagePath = dirName+'/images.json';
    const filePath = dirName+'/files.json';

    let imagesArr = '';
    let filesArr='';
    let P1 = new Promise((resolve, reject)=> {
      fs.readFile(imagePath, (err, data) => {
        if (err) reject('读取图片文件失败');
        imagesArr = data.toString();
        imagesArr = imagesArr.split(',');
        resolve(1);
      });
    });
    let P2 = new Promise((resolve, reject)=> {
      fs.readFile(filePath, (err, data) => {
        if (err) reject('读取文件列表失败');
        filesArr = data.toString();
        filesArr = filesArr.split(',');
        resolve(1);
      });
    });

    Promise.all([P1, P2]).then((res)=>{
      var len1 = imagesArr.length;
      var len2 = filesArr.length;
      var arrIndex = [];
      var P=[];
      for(var j=0; j<len2; j++) {
        P[j] = new Promise((resolve, reject)=> {
          fs.readFile(filesArr[j], (err, data) => {
            if (err) reject('读取文件信息失败');
            for(var i=0; i<len1; i++) {
              if(imagesArr[i]){
                let imageNameReg = new RegExp("[\'|\"|\}|\'\/|\"\/|\}\/]"+imagesArr[i]+"[\'|\"|\)\'|\)\"|\?]","gim");
                let fileStr = data.toString();
                if(imageNameReg.test(fileStr)) {
                  if(arrIndex.indexOf(imagesArr[i]) == -1) {
                    arrIndex.push(imagesArr[i]);
                  }
                } 
              } 
            } 
            resolve(1);         
          })
        });
      }

      Promise.all(P).then((res)=>{
        for(let j=arrIndex.length-1; j>=0; j-- ) {
          var index = imagesArr.indexOf(arrIndex[j]);
          imagesArr.splice(index,1);
        }
        imagesArr
        imagesArr = imagesArr.join(',').replace(/,/g, '\n');
        fs.writeFile(dirName+'/images_delete.json',imagesArr,(res)=>{
          console.log('mission complete!');
          console.log('查询结果保存在如下文件中：'+dirName+'/images_delete.json');
        })
      }).catch((err)=>{
        console.log(err);
      });
    }).catch((err)=>{
      console.log(err);
    });
  }
}

let getFiles={//找出所有可能会引用图片的文件路径
  basePath:['D:/working/e_platform/a_code_for_develop/e_platform_git/repos_mobile/APP/e_platform_app','D:/working/e_platform/a_code_for_develop/e_platform_git/repos_mobile/offline_qrcode_miniprogram','D:/working/e_platform/a_code_for_develop/e_platform_git/repos_mobile/print_qrcode_miniprogram','D:/working/e_platform/a_code_for_develop/e_platform_git/repos_mobile/wap'],//需要查询的项目路径
  filesArr:[],
  mapDir: function() {
    var _this = this;
    fs.readdir(_this.basePath[0], function(err, files) {
      let dir = _this.basePath[0];
      _this.basePath.shift();
      if (err) return;

      let P=[];
      files.forEach((filename, index) => {
        P[index] = new Promise((resolve, reject)=>{
          let pathname = path.join(dir, filename);
          fs.stat(pathname, (err, stats) => { // 读取文件信息
            if (err) reject('读取文件类型失败');

            if (stats.isDirectory()) {
              _this.basePath.push(pathname);
            } else if (stats.isFile()) {
              if (['.vue', '.wxml','.js','.html'].includes(path.extname(pathname))) {  // 排除 目录下的 json less 文件
                _this.filesArr.push(pathname);
              }
            }
            resolve(1);       
          })
        });
      })
      Promise.all(P).then((res)=>{
        if(_this.basePath.length>0) {
          _this.mapDir();
        } else {
          fs.writeFile(dirName+'/files.json',_this.filesArr,(res)=>{
            console.log('包含图片的文件已检索完毕');
            handleImages.init();
          })
        }
      }).catch((err)=>{
        console.log(err)
      });
    })
  }
}

let getImages={//找出项目图片文件夹中所有的图片名称
  imageArr:[],
  pathArr:[['D:/working/e_platform/a_code_for_develop/e_platform_git/repos_mobile/wap/image','']],//初始化的项目图片存放路径
  mapDir: function() {
    var _this = this;
    fs.readdir(_this.pathArr[0][0], function(err, files) {
      let dir = _this.pathArr[0][0];
      let directory = _this.pathArr[0][1];
      _this.pathArr.shift();
      if (err) return;
      
      let P=[];
      files.forEach((filename, index) => {
        P[index] = new Promise((resolve, reject)=>{
          let pathname = path.join(dir, filename);
          fs.stat(pathname, (err, stats) => { // 读取文件信息
            if (err) reject('读取文件类型失败');
            if (stats.isDirectory()) {
              var cDir = directory?directory+'/'+filename:filename;
              _this.pathArr.push([pathname,cDir]);
            } else if (stats.isFile()) {
              var imageName = directory?directory+'/'+filename:filename;
              _this.imageArr.push(imageName);
            }
            resolve(1);
          })
        });
      })
      Promise.all(P).then((res)=>{
        if(_this.pathArr.length>0) {
          _this.mapDir();
        } else {
          fs.writeFile(dirName+'/images.json',_this.imageArr,(res)=>{
            console.log('图片已检索完毕');
            getFiles.mapDir();
          })
        }
      }).catch((err)=>{
        console.log(err)
      });
    })
  }
}
getImages.mapDir();