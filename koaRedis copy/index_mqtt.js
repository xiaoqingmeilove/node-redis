var mqtt=require('mqtt');
var express = require('express');
var bodyParser = require('body-parser');
var SERVER_PORT = process.env.PORT || 8080;
var SERVER_HOST = process.env.HOST || "localhost";
var request = require('request');

var server = express();
var count = false
var num = 0

server.use(bodyParser.json({limit: '5mb'}));
server.use(bodyParser.urlencoded({extended: true,limit: '5mb',parameterLimit:50000}));
server.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if(req.url == '/test1'){
    next();
  }else{
    var options = {
        url: "http://localhost:8900/push",
        headers: {
            'content-type': "application/json",
        },
        body: JSON.stringify({url:SERVER_HOST+":"+SERVER_PORT+req.url,value:req.body})
     };
     request.post(options)
     if(!count){
        count = true
        var options1 = {
            url: "http://localhost:8900/saved",
            headers: {
                'content-type': "application/json",
            },
            body: JSON.stringify({})
         };
         request.post(options1)
     }
  }
});

server.post('/test1', function(req, res){
    console.log("test1")
});

server.post('/test2', function(req, res){
    console.log("test2")
});

server.post('/test3', function(req, res){
    console.log("test3")
});

var client=mqtt.connect('tcp://localhost:8082');
client.subscribe("test");
client.on('message',function(topic,message){
　　 var result = JSON.parse(message);　　//接收到新消息，并对其进行处理
    console.log('result---->',result);
    if(result.state == "pull"){
        console.log("rrererrererrer",num++)
        setTimeout(function(){
            client.publish('ready',JSON.stringify({value:{}}),{qos:5,retain:true});  
        },1000)     
    }
    if(result.state == "finish"){
        console.log("处理完毕")
        count = false
        num = 0
    }
})

server.listen(SERVER_PORT, () => console.log(
    `Server is now running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${SERVER_PORT}`
));


