var compressor = require('node-minify');
var build_name = require('./build_name');

desc('Builds minified kivi.js file.');
task('build', {async: true}, function (params) {
  new compressor.minify({
    type: 'gcc',
    fileIn: ['kivi.js'],
    fileOut: build_name.buildName,
    callback: complete
  });
});

desc('Start example server.');
task('server', ['build'], function (params) {
  var cmds = [
    'node ./server.js'
  ];
  jake.exec(cmds, function () {
    complete();
  }, {printStdout: true});
});
