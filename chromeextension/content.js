const API_HOST = "https://yahoo-fantasy-bball-stat-video.herokuapp.com"

console.log("testing something!");
var div = document.createElement('div');
var label = document.createElement('span');
label.textContent = "Hello, world";
div.appendChild(label);
document.body.appendChild(div);
console.log("I did something!");


async function getVideos() {
    let url = 'users.json';
    try {
        let url = new URL(`${API_HOST}/playervideos`),
        params = {
            playerName: "De'Anthony Melton",
            teamAbbreviation:"MEM",
            gameDate: "2021-10-26",
            statType: "STL",
        }
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
        let res = await fetch(url, {method: 'GET'})
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

async function logVideoResults() {
    let vidoeResults = await getVideos()
    console.log(vidoeResults)
}

logVideoResults()