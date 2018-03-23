const Koa = require('koa');
const redis = require('redis');
const koaBody = require('koa-body');
var mosca = require('mosca');
var redisStore = require('koa-redis');

// var redisCase = require("./control/redisCase.js");

var redis_config = {
    "host": "localhost",
    "port": 6379,
    "auth_pass":"root"
};
var client = redis.createClient(redis_config);
var options = {client: client, db: 1};
var store = redisStore(options);
const app = new Koa();


var mqttServer = new mosca.Server({
  port: 8082,
  http: {
      port: 8084,
      static: __dirname + "/public",
      bundle: true
  }
});


var count = 0
app.use(koaBody({ multipart: true }));
app.use(function *() {
  switch (this.path) {
    case '/push':
    console.log("zzzzzz",count++)
      store.client.rpush("message", JSON.stringify(this.request.body)) 
      break;
    case '/pull':
      var result = yield store.client.rpop("lmessage");
      console.log("qqqqqq",result)
      break;
    case '/num':
      var num = yield store.client.llen("message")
      console.log("wwqq",num)
      break;
    case '/saved':
      store.client.rpop("message").then(function(res_final){
        console.log("aaaaaa",res_final)
        if(res_final){
          mqttServer.publish({topic:'test',payload:JSON.stringify({state:"pull",value:res_final}),qos:5,dup:true});  
        }else{
          mqttServer.publish({topic:'test',payload:JSON.stringify({state:"finish",value:null}),qos:5,dup:true});  
        }
      })
      break;
  }
})

mqttServer.on('published', function(packet, client){
  if(packet.topic == "ready"){
    store.client.rpop("message").then(function(res_final){
      console.log("ccccc",res_final)
      if(res_final){
        mqttServer.publish({topic:'test',payload:JSON.stringify({state:"pull",value:res_final}),qos:5,dup:true});  
      }else{
        mqttServer.publish({topic:'test',payload:JSON.stringify({state:"finish",value:null}),qos:5,dup:true});  
      }
    })
  }

})
mqttServer.on('clientConnected', function(client){
  console.log('client connected',client.id);

});
mqttServer.on('ready', function(){
  console.log('mqttServer is running...');
});
client.on('connect', function (e) {
    console.log("成功连接开始监听8900")
    app.listen(8900);
});
