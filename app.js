var login = require("facebook-chat-api");
var storage = require("lowdb/lib/file-sync");
var jsonfile = require("jsonfile");
var low = require("lowdb");

var db = low('db.json', { storage: storage });

var data={};
try{
    data = jsonfile.readFileSync("data.json");
}catch(e){}

var basic={};
try{
    basic = jsonfile.readFileSync("basic.json");
}catch(e){}

var reset = function(tid){
    data[tid]={};
};

var dist = function(word){
    
};

var generateMessage = function(tid,uid){
    if(!data[tid][uid]){
        return "...";
    }
    if(typeof uid === 'undefined'){
        return "...";
    }
    else{
        var ret='';
        var cur='[START]';
        while(cur!='[END]'){
            var words = data[tid][uid][cur];
            var tot = 0;
            for(var word in words){
                tot+=words[word];
            }
            var sorted = Object.keys(words).sort(function(a,b){return words[a]-words[b]});
            var n = Math.random();
            var c = 0;
            for(var j in sorted){
                c+=parseInt(words[sorted[j]],10);
                if(c/tot>=n){
                    cur=sorted[j];
                    if(sorted[j]!="[END]"){
                        ret+=sorted[j]+" ";
                    }
                    break;
                }
            }
        }
        return ret;
    }
    
};

login({email: process.env.EMAIL, password: process.env.PASSWORD}, function callback (err, api) {
    if(err) return console.error(err);
 
    api.listen(function callback(err, message) {
        if(err) console.log(err);
        if(typeof message == 'undefined'){
            console.log('failed');
            return;
        }
        if(typeof message.body == 'undefined'){
            console.log('empty');
            return;
        }
        var senderid=message.senderID;
        var tid=message.threadID;
        var txt=message.body.toLowerCase();
        console.log(txt);
        var u = db.get('users').find({"id" : senderid});
        if(!u){
            var usr={"name": message.senderName,"id": message.senderID};
            db.get('users').push(usr);
        }
        if(txt.charAt(0)=="~"){
            var cmd = txt.substring(1,txt.length).split(' ');
            var params = cmd.slice(1,cmd.length);
            cmd = cmd[0];
            if(true){
                if(cmd=="reset"){
                    reset(tid);
                    api.sendMessage("Reset! :D",tid);
                }
                else if(cmd=="talk"){
                    var mes = '...';
                    var uid = 0;
                    if(params[0]){
                        if(params[0] == 'me') uid = senderid;
                        var person = params.join(' ');  
                        uid = db.get('users').find({"name" : person});
                        if(!uid){
                            uid=-1;
                        }
                        else{
                            uid=uid['id'];
                        }
                    }
                    console.log("Generating message like "+uid+" to: "+tid);
                    mes = generateMessage(tid,uid);
                    console.log("Sending message to "+tid+": "+mes);
                    api.sendMessage(mes,tid);
                }
                else{
                    api.sendMessage("I don't get it :(",tid);
                }
            }
        }
        else{
            var msg = txt.replace(/[^A-Za-z0-9|']/g, ' ').split(' ');
            for(var i = msg.length - 1; i >= 0; i--) {
                if(msg[i] == '') {
                    msg.splice(i, 1);
                }
            }
            msg.push("[END]");
            console.log(msg);
            if(!data[tid]){
                data[tid]={};
            }
            if(!data[tid][senderid]){
                data[tid][senderid]={};
            }
            if(!data[tid][0]){
                data[tid][0]={};
            }
            if(msg.length>1){
                var prev='[START]';
                msg.forEach(function(v,i,m){
                    if(data[tid][senderid][prev]){
                        if(data[tid][senderid][prev][v]){
                            data[tid][senderid][prev][v]+=1;
                        }
                        else{
                            data[tid][senderid][prev][v]=1;
                        }
                    }
                    else{
                        data[tid][senderid][prev]={};
                        data[tid][senderid][prev][v]=1;
                    }
                    prev=v;
                });
                prev='[START]';
                msg.forEach(function(v,i,m){
                    if(data[tid][0][prev]){
                        if(data[tid][0][prev][v]){
                            data[tid][0][prev][v]+=1;
                        }
                        else{
                            data[tid][0][prev][v]=1;
                        }
                    }
                    else{
                        data[tid][0][prev]={};
                        data[tid][0][prev][v]=1;
                    }
                    prev=v;
                });
            }
            if(Math.random()>.95){
                var blah = generateMessage(tid,0);
                console.log("Saying: "+blah);
                api.sendMessage(blah,tid);
            }
        }
        jsonfile.writeFileSync("data.json", data);
    });
});