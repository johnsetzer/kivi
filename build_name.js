var fs = require('fs');

var pack = JSON.parse(fs.readFileSync('package.json'));

exports.buildName = 'kivi-' + pack.version + '.min.js';