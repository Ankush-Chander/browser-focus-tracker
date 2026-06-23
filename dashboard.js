function getToday(){

return new Date()
.toISOString()
.split("T")[0];

}

function formatTime(ms){

const mins=Math.floor(ms/60000);

const hrs=Math.floor(mins/60);

if(hrs>0){

return `${hrs}h ${mins%60}m`;

}

return `${mins}m`;

}

function calculateFocusScore(stats){

let score=100;

score-=stats.switches*1.5;

score-=stats.shortVisits*3;

const sites=
Object.keys(stats.sites).length;

if(sites>15){

score-=10;

}

return Math.max(
    0,
    Math.min(
        100,
        Math.round(score)
    )
);

}

async function loadDashboard(){


const storage=
await chrome.storage.local.get(
"dailyStats"
);


const today=getToday();

const stats=
storage.dailyStats?.[today];


if(!stats){

document.body.innerHTML+=
"<h2>No data available</h2>";

return;

}

const score =
calculateFocusScore(stats);

const scoreElement =
document.getElementById(
"focusScore"
);

const labelElement =
document.getElementById(
"focusLabel"
);

scoreElement.textContent =
`${score}/100`;

scoreElement.classList.remove(
"green",
"orange",
"red"
);


if(score>=80){

scoreElement.classList.add(
"green"
);

labelElement.textContent=

"Highly Focused";

}

else if(score>=50){

scoreElement.classList.add(
"orange"
);

labelElement.textContent=

"Moderately Focused";

}

else{

scoreElement.classList.add(
"red"
);

labelElement.textContent=

"Distracted";

}
let total=0;

Object.values(stats.sites)
.forEach(time=>{

total+=time;

});

document.getElementById(
"browsingTime"
).textContent=

`Total Browsing Time : ${formatTime(total)}`;

document.getElementById(
"switches"
).textContent=

`Tab Switches : ${stats.switches}`;

document.getElementById(
"siteCount"
).textContent=

`Sites Visited : ${Object.keys(stats.sites).length}`;

const topSites=
Object.entries(stats.sites)

.sort((a,b)=>b[1]-a[1])

.slice(0,10);

const container=
document.getElementById(
"topSites"
);

topSites.forEach(
([domain,time])=>{

const div=
document.createElement("div");

div.className="site";

div.innerHTML=`

<strong>

${domain}

</strong>

<br>

${formatTime(time)}

`;
container.appendChild(div);

});

}

loadDashboard();