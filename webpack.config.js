const path=require('path'); //调用node.js中的路径
module.exports = {
    entry: {
        index:'./main.js' //需要打包的文件
    },    // 需要被打包的js文件路径及文件名
    output: {
        path: path.resolve(__dirname,'./Hpage'),    // 打包输出的目标文件的绝对路径（其中__dirname为当前目录的绝对路径）
        filename: 'index.js'   // 打包输出的js文件名及相对于dist目录所在路径
    },
    mode: "production"
};