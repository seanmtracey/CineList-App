require('dotenv').config({silent : process.env.NODE_ENV !== 'development'});
const static = require('node-static');
const file = new static.Server('./public');
 
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(process.env.PORT || 7890);