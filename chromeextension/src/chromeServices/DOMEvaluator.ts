const API_HOST = "https://yahoo-fantasy-bball-stat-video.herokuapp.com"
const SELECTED_DATE : any = getSelectedDate()

// ATTRIBUTES_MAP key = Yahoo's Naming. Value = NBA's API Naming.
const ATTRIBUTES_MAP : { [key: string]: string | string[] } = {
    "Field Goals Made/Field Goals Attempted": ["FGM", "FGA"],
    "Free Throws Made/Free Throws Attempted": ["FGM", "FGA"],
    "3-point Shots Made": "FG3M",
    "Total Rebounds": "REB",
    "Assists": "AST",
    "Steals": "STL",
    "Blocked Shots": "BLK",
    "Turnovers": "TOV",
}

function getElementsByXpath(path: string, parent: Node | null) {
    let results = [];
    let query = document.evaluate(path, parent || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}

function getElementByXpath(path: string, parent: Node | null) {
    return document.evaluate(path, parent || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

async function getVideos(url: string) {
    try {
        let res = await fetch(url, {method: 'GET'})
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

function createLink(playerName: string, teamAbbreviation: string, gameDate: string, statType: string) {
    let url = new URL(`${API_HOST}/playervideos`)
    let params : { [key: string]: string } = {
        playerName: playerName, //"De'Anthony Melton",
        teamAbbreviation: teamAbbreviation, // "MEM",
        gameDate: gameDate, // "2021-10-26",
        statType: statType, // "STL",
    }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    return url.toString()
}

function getSelectedDate() {
    let selectedDateElem = getElementByXpath(`//select[@name="date"]/option[@selected]`, null)
    if (selectedDateElem == null) {
        console.log("date element is null")
        return ""
    }
    let valueURL = (selectedDateElem as HTMLElement).getAttribute("value") // e.g. "https://basketball.fantasysports.yahoo.com/nba/63851/1/team?pspid=782202516&activity=myteam&date=2021-10-28"
    if (valueURL == null) {
        return ""
    }
    const urlParams = new URLSearchParams(valueURL)
    return urlParams.get('date')
}

// getHeaderIndexes returns a map with the header names that map to their indexes.
function getHeaderIndexes() {
    let headerIndexMap : { [key: string]: number } = {}
    let headerElements = getElementsByXpath(`//table[@id="statTable0"]/thead/tr[2]/th`, null);
    for (var idx = 0; idx < headerElements.length; idx++) {
        let elem : Node | null = headerElements[idx]
        if (elem == null ) {
            continue
        }
        let elementTitle = (elem as HTMLElement).getAttribute("title")
        if (elementTitle == null) {
            continue
        }
        if (ATTRIBUTES_MAP.hasOwnProperty(elementTitle)) {
            headerIndexMap[elementTitle] = idx
        }
    }
    return headerIndexMap
}

function getPlayerData() {
    let playerDataList = []
    let playerCellElements = getElementsByXpath(`//table[@id="statTable0"]/tbody/tr/td//div[contains(@class, "ysf-player-name")]`, null);
    for (var idx = 0; idx < playerCellElements.length; idx++) {
        let elem : Node | null = playerCellElements[idx]
        if (elem == null ) {
            continue
        }
        let playerNameElem = getElementByXpath(`a[contains(@class, "name")]`, elem)
        if (playerNameElem == null) {
            continue
        }
        let playerName = (playerNameElem as HTMLElement).innerText
        let playerTeamPosElem = getElementByXpath(`span[contains(text(), "-")]`, elem)
        if (playerTeamPosElem == null) {
            continue
        }
        let playerTeam = (playerTeamPosElem as HTMLElement).innerText.split("-")[0].trim()
        // console.log(`${playerName}: ${playerTeam}`)
        playerDataList.push({
            playerName: playerName,
            teamAbbreviation: playerTeam,
        })
    }
    return playerDataList
}

async function updateStatCells() {
    let headerIndexMap = getHeaderIndexes()
    let playerDataList = getPlayerData()
    for (let playerRowIdx = 0; playerRowIdx < playerDataList.length; playerRowIdx++) {
        let playerName = playerDataList[playerRowIdx]["playerName"]
        let teamAbbreviation = playerDataList[playerRowIdx]["teamAbbreviation"]
        let playerRowElem = getElementByXpath(`//table[@id="statTable0"]/tbody/tr[${playerRowIdx + 1}]`, null)
        for (const [yahooStatName, colIndex] of Object.entries(headerIndexMap)) {
            let statCellElem : any = getElementByXpath(`td[${colIndex+1}]/div`, playerRowElem)
            // console.log(`${yahooStatName}: td[${colIndex+1}]/div`)
            // console.log(statCellElem)
            let statValue = (statCellElem as HTMLElement).innerText
            // Skip cells where there's no stat.
            if (statValue === "-" || statValue === "0" || statValue === "-/-") {
                continue
            }
            // console.log(statValue)
            switch (yahooStatName) {
                case "Field Goals Made/Field Goals Attempted":
                case "Free Throws Made/Free Throws Attempted": // @ts-ignore
                    let nbaAPIStatNames : any = ATTRIBUTES_MAP[yahooStatName]
                    for (let statType in nbaAPIStatNames) {
                        makeCellClickable(statCellElem, playerName, teamAbbreviation, statType)
                    }
                    break
                default:
                    if (ATTRIBUTES_MAP.hasOwnProperty(yahooStatName)) {
                        let statType : any = ATTRIBUTES_MAP[yahooStatName]
                        makeCellClickable(statCellElem, playerName, teamAbbreviation, statType)
                    }
            }
        }
    }
}

function makeCellClickable(element: Node, playerName: string, teamAbbreviation: string, statType: string) {
    // `element` is the element you want to wrap
    let parent : any = element.parentNode;
    var wrapper = document.createElement('a');
    wrapper.style.cursor = "pointer"

    // set the wrapper as child (instead of the element)
    parent.replaceChild(wrapper, element);
    // set element as child of wrapper
    wrapper.appendChild(element);

    let link = createLink(playerName, teamAbbreviation, SELECTED_DATE, statType)

    wrapper.addEventListener('click', async () => {
        // console.log(link);
        let videoResults : any[] = await getVideos(link)
        updateModalDisplayData(playerName, teamAbbreviation, videoResults)
    })
}

function createModal() {
    let modalHtml : string = `
<div class="play-by-play-videos-modal" style="left: 735.891px; top: 541.984px;">
    <div class="play-by-play-modal-header">
        <h5>Play by Play Videos</h5>
    </div>
    <div class="play-by-play-modal-body">
        <div class="pbp-player-info">
            <h4 id="pbp-player-name"></h4>
            <h4 id="pbp-team-name"></h4>
        </div>
        <ul id="pbp-videos-list"></ul>
        <div id="php-video-container"></div>
    </div>
    <div class="play-by-play-modal-footer"></div>
</div>
    `
    var div = document.createElement('div');
    div.innerHTML = modalHtml.trim();
    let modalElem = div.firstChild;
    let outwrapperElem : any = document.getElementById("outer-wrapper")
    outwrapperElem.appendChild(modalElem)
}

function updateModalDisplayData(playerName: string, teamAbbreviation: string, videoResults : any[]) {
    // Update Header to Player Name and Team.
    let playerNameElem : any = document.getElementById("pbp-player-name")
    playerNameElem.innerText = playerName
    let teamNameElem : any = document.getElementById("pbp-team-name")
    teamNameElem.innerText = teamAbbreviation
    // Update Header to Show Player Photo.
    // Update Body to Show List of Videos Links.
    let pbpVideosListElem = document.getElementById("pbp-videos-list")
    if (pbpVideosListElem == null) {
        console.log("couldn't find videos list element")
        return
    }
    // Delete all list items.
    pbpVideosListElem.childNodes.forEach((elem) => elem.remove())
    // Repopulate list items.
    for (let idx = 0; idx < videoResults.length; idx++) {
        let result = videoResults[idx]
        let description : string = result["description"]
        let videoURL : string = result["small_url"]
        console.log(description)
        console.log(videoURL)
        let listElem = document.createElement('li');
        listElem.innerText = description
        // Add click listener for each list item.
        listElem.addEventListener('click', () => {
            let videoHtml : string = `
<video
id="php-video-player"
class="video-js"
controls
preload="auto"
width="480"
height="270"
data-setup="{}"
>
<source src="${videoURL}" type="video/mp4" />
<p class="vjs-no-js">
    To view this video please enable JavaScript, and consider upgrading to a web browser that
    <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
</p>
</video>
        `
            let div = document.createElement('div');
            div.innerHTML = videoHtml.trim()
            let videoElem = div.firstChild
            let phpVideoContainerElem : any = document.getElementById("php-video-container")
            phpVideoContainerElem.appendChild(videoElem)
            // @ts-ignore
            videojs("php-video-player");
        })
        pbpVideosListElem.appendChild(listElem)
    }
}

createModal()
updateStatCells()

export {}