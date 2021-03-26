#!/usr/bin/env node
if(process.env.Idebugger){
    module.exports =  require('../src/replaceSource');
}else{
    module.exports =  require('../lib/replaceSource');
}