var login = require("facebook-chat-api");
var storage = require("lowdb/file-sync");
var jsonfile = require("jsonfile");
var low = require("lowdb");

var db = low('db.json', { storage: storage });
var data = {};
try{
    data = jsonfile.readFileSync("data.json");
}catch(e){}

var blacklist = ["allahu","akbar"];
try{
    var blkf = jsonfile.readFileSync("blacklist.json");
    blacklist = blkf["blocked"];
}catch(e){}

var reset = function(tID){
    data[tID]={};
};

var generateMessage = function(tID, l){
    var words = data[tID];
    if(Object.keys(words).length==0){
        return "...";
    }
    var tot = 0;
    for(var word in words){
        tot+=words[word];
    }
    var sorted = Object.keys(words).sort(function(a,b){return words[a]-words[b]});
    var ret = "";
    for(var i=0;i<l;i++){
        var n = Math.random();
        var c = 0;
        for(var j in sorted){
            c+=parseInt(words[sorted[j]],10);
            //console.log(c,tot,j,sorted);
            if(c/tot>=n){
                ret+=sorted[j]+" ";
                break;
            }
        }
    }
    return ret;
};

login({email: process.env.EMAIL, password: process.env.PASSWORD}, function callback (err, api) {
    if(err) return console.error(err);
 
    api.listen(function callback(err, message) {
        if(err) console.log(err);
        var tID=message.threadID;
        var txt=message.body;
        var thread={"name": message.threadName,"id": message.threadID};
        var t = db('threads').find({"id" : tID});
        if(!t){
            db('threads').push(thread);
        }
        if(txt.charAt(0)=="~"){
            var cmd = txt.substring(1,txt.length).split(' ');
            var params = cmd.slice(1,cmd.length);
            cmd = cmd[0];
            var l = parseInt(cmd,10);
            if(isNaN(l)){
                if(cmd=="reset"){
                    reset(tID);
                    api.sendMessage("Reset! :D",tID);
                }
                else if(cmd=="blacklist"){
                    for(var i in params){
                        if(blacklist.indexOf(params[i])==-1){
                            blacklist.push(params[i]);
                            data[tID][params[i]]=0;
                            api.sendMessage("I now hate the word "+params[i]+".",tID);
                        }
                    }
                    if(params.length==0){
                        api.sendMessage(blacklist.join(', '),tID);
                    }
                }
                else if(cmd=="whitelist"){
                    for(var i in params){
                        if(params[i]=="allahu" || params[i]=="akbar"){
                            api.sendMessage("No thanks.",tID);
                            break;
                        }
                        var index = blacklist.indexOf(params[i]);
                        if(index>-1){
                            blacklist.splice(index,1);
                            api.sendMessage("I now like the word "+params[i]+".",tID);
                        }
                    }
                }
                else if(cmd=="help"){
                    api.sendMessage("Help:\n~n: say [n] words\n~reset: reset\n~blacklist [word1 word2 ...]: block the words, or list the blacklist\n~whitelist word1 word2 ...: unblock the words",tID);
                }
                else{
                    api.sendMessage("I don't get it...",tID);
                }
            }
            else if(l>20){
                api.sendMessage("I won't say that many words...",tID);
            }
            else{
                var mes = generateMessage(tID,l);
                console.log("Sending message to "+tID+": "+mes);
                api.sendMessage(mes,tID);
            }
        }
        else{
            var msg = txt.replace(/[^A-Za-z0-9|']/g, ' ').split(' ');
            console.log(msg);
            var tdata = data[tID];
            if(!tdata){
                data[tID]={};
            }
            var blocked = false;
            for(var blkw in blacklist){
                //console.log("Checking: "+blacklist[blkw]);
                if(msg.indexOf(blacklist[blkw])!=-1){
                    console.log("Blocked: "+blacklist[blkw]);
                    api.sendMessage("Fuck you.",tID);
                    blocked = true;
                    break;
                }
            }
            if(!blocked){
                msg.forEach(function(v,i,m){
                    if(v!=""){
                        if(data[tID][v]){
                            data[tID][v]+=1;
                        }
                        else{
                            data[tID][v]=1;
                        }
                    }
                });
            }
            jsonfile.writeFileSync("data.json", data);
            jsonfile.writeFileSync("blacklist.json", {blocked:blacklist});
        }
    });
});