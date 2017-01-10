var jsonfile = require("jsonfile");

var basic={};
try{
    basic = jsonfile.readFileSync("basic.json");
}catch(e){}

jsonfile.writeFileSync("data.json", basic);