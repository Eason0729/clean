var fs = require("fs");
var set=require('./set.json')
var result=require('./result.json')
var output={};
var config={loop_max:500,skip:[1,2]};

//extend prototype
Array.prototype.top=function(){
    return this[this.length-1];
}
Array.prototype.shuffle =function(){
    return this.sort(() => Math.random() - 0.5);
}

//pre process people
var temp=[];
for (var i=1;i<=42;i++)
    temp.push({list:[],identity:i,joined:false});
console.log(temp.length)
for(var prop in result.final){
    if(!result.final.hasOwnProperty(prop))continue;
    if(!result.final[prop].data)continue;
    var list=result.final[prop].data.map((x)=>{
        var code=x.code,priority=+x.priority;
        return {code,priority}
    }).sort((a,b)=>a.priority-b.priority).map((x)=>x.code);
    temp[+prop-1]={
        list,
        identity:+prop,joined:false
    };
}
result=temp;
delete temp;
console.log(temp.length)
console.log(result.sort((a,b)=>a.identity-b.identity))
//skip
config.skip.forEach((x)=>{result[x-1].joined=true;})
//pre process set
set=set.data.map((x)=>{
    var name=x.name,amount=+x.require,code=x.code;
    return {name,amount,code};
})

//stage result
// console.log(result);

var force_pass=false;
//false is ended
function check(){
    if(force_pass)return false;
    for(var item of result)
        if(item.list.length)return true; 
    return false;
}

var loop=0;
while(check()){
    loop++;
    if(loop==config.loop_max)force_pass=true
    var set=set.map(job => {
        if(job.amount==0){
            for(var i=1;i<=42;i++)
                if(result[i-1].list.top()==job.code)result[i].list.pop();
            return job;
        }
        // find person with job on top
        var people=result.filter((x)=>(!x.joined&&(x.list.length!=0))).filter((x)=>(x.list.top()==job.code)).shuffle()
        while(job.amount!=0&&people.length!=0){
            var person=people.pop();
            job.amount--;
            result[person.identity-1].joined=true;
            if(output[job.code])output[job.code].push(person.identity);
            else output[job.code]=[person.identity];
            console.log(`${person.identity} applied for ${job.name} ${job.code}`);
        }
        return job;
    });
}
// console.log(result.filter((x)=>(!x.joined)));



var temp1=
result.filter((x)=>(!x.joined)).map(x=>x.identity).shuffle();

set.forEach(job => {
    while(job.amount!=0){
        job.amount--;
        var id=temp1.pop();
        if(output[job.code])output[job.code].push(id);
        else output[job.code]=[id];
        console.log(`${id} applied for ${job.name} ${job.code}`);
    }
});

//write to stream
var virtual_stream='';

for(var prop in output){
    virtual_stream+=`${prop},${output[prop].join(',')}\n`;
}

fs.writeFile('result.csv', virtual_stream, 'utf8',function (err) {
    if (err) return console.log(err);
});