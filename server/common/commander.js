 const program = require('commander');
 const Package = require('../../package');

 program
     .version(Package.version)
     .option('-p, --port <n>', '端口号')
     .option('-b, --build <n>', '生产模式')
     .parse(process.argv);
 
 module.exports = program;
 