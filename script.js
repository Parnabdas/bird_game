let anger=100;
let love=50;

const game=document.getElementById("game");

function update(){

document.getElementById("love").innerHTML=love;
document.getElementById("anger").innerHTML=anger;

}

function shootFire(){

let f=document.createElement("div");

f.className="fire";

f.innerHTML="🔥";

f.style.bottom="100px";

game.appendChild(f);

setTimeout(()=>{

love-=10;

if(love<0) love=0;

update();

f.remove();

check();

},2800);

}

function shootHeart(){

let h=document.createElement("div");

h.className="heart";

h.innerHTML="❤️";

h.style.bottom="150px";

game.appendChild(h);

setTimeout(()=>{

anger-=10;

love+=5;

if(anger<0) anger=0;

update();

h.remove();

check();

},2800);

}

function check(){

if(anger<=0 && love>=100){

clearInterval(gameLoop);

document.getElementById("message").innerHTML="💋 LOVE WINS ❤️";

walkTogether();

}

}

function walkTogether(){

let a=document.getElementById("angry");

let b=document.getElementById("lovebird");

let x1=120;
let x2=window.innerWidth-180;

let t=setInterval(()=>{

x1+=4;
x2-=4;

a.style.left=x1+"px";
b.style.left=x2+"px";

if(x2-x1<90){

clearInterval(t);

document.getElementById("message").innerHTML="💋 They Kiss Forever ❤️";

}

},20);

}

update();

const gameLoop=setInterval(()=>{

shootFire();

shootHeart();

},1000);