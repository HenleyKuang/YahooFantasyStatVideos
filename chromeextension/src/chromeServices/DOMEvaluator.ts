// import Modal from 'bootstrap/js/dist/modal';
// import './modules/bootstrap.bundle.js'
import MicroModal from './modules/micromodal.min.js';

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
                        makeCellClickable(statCellElem, playerName, teamAbbreviation, statType, statValue, yahooStatName)
                    }
                    break
                default:
                    if (ATTRIBUTES_MAP.hasOwnProperty(yahooStatName)) {
                        let statType : any = ATTRIBUTES_MAP[yahooStatName]
                        makeCellClickable(statCellElem, playerName, teamAbbreviation, statType, statValue, yahooStatName)
                    }
            }
        }
    }
}

function getOffset(el : any) {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.right + window.scrollX,
      top: rect.top + window.scrollY
    };
}

function makeCellClickable(element: Node, playerName: string, teamAbbreviation: string, statType: string, statValue: string, yahooStatName: string) {
    // `element` is the element you want to wrap
    let parent : any = element.parentNode;
    var wrapper = document.createElement('a');
    wrapper.style.cursor = "pointer"

    // set the wrapper as child (instead of the element)
    parent.replaceChild(wrapper, element);
    // set element as child of wrapper
    wrapper.appendChild(element);

    let link = createLink(playerName, teamAbbreviation, SELECTED_DATE, statType)

    wrapper.addEventListener('click', async (e : any) => {
        // console.log(link);
        let videoResults : any[] = await getVideos(link)
        updateModalDisplayData(playerName, teamAbbreviation, yahooStatName, statValue, videoResults)
        // set modal left and top location
        let offset = getOffset(e.target)
        let modalContainer = (document.getElementById("modal-1-container") as HTMLElement)
        modalContainer.style.left = (offset.left + 10).toString() + "px"
        modalContainer.style.top = offset.top.toString() + "px"
        MicroModal.show('modal-1');
    })
}

function createModal() {
    let modalHtml : string = `
<div class="modal micromodal-slide" id="modal-1" aria-hidden="true">
<div class="modal__overlay" tabindex="-1" data-micromodal-close>
  <div class="modal__container" id="modal-1-container" role="dialog" aria-modal="true" aria-labelledby="modal-1-title">
    <header class="modal__header">
      <h2 class="modal__title" id="modal-1-title"></h2>
      <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
    </header>
    <main class="modal__content" id="modal-1-content">
      <h4 id="pbp-player-name"></h4>
      <h4 id="pbp-team-name"></h4>
      <h4 id="pbp-stat-name"></h4>
      <ul id="pbp-videos-list"></ul>
      <div id="php-video-container"></div>
    </main>
    <footer class="modal__footer">
      <button class="modal__btn modal__btn-primary">Continue</button>
      <button class="modal__btn" data-micromodal-close aria-label="Close this dialog window">Close</button>
    </footer>
  </div>
</div>
</div>
    `
    var div = document.createElement('div');
    div.innerHTML = modalHtml.trim();
    let modalElem = div.firstChild;
    let outwrapperElem : any = document.getElementById("outer-wrapper")
    outwrapperElem.appendChild(modalElem)
    console.log(modalElem)
    MicroModal.init()
}

async function updateModalDisplayData(playerName: string, teamAbbreviation: string, yahooStatName: string, statValue: string, videoResults : any[]) {
    // Update modal title to Player Name and the stat title.
    let statTitle = statValue + " " + yahooStatName // e.g. 4 3-point Shots Made
    let modalTitleElem : any = document.getElementById("modal-1-title")
    modalTitleElem.innerText = playerName + " - " + statTitle
    // Update Header to Show Player Photo.
    // TODO(henleyk)
    // Update Body to Show List of Videos Links.
    let pbpVideosListElem = document.getElementById("pbp-videos-list")
    if (pbpVideosListElem == null) {
        console.log("couldn't find videos list element")
        return
    }
    // Delete all list items.
    while (pbpVideosListElem.firstChild) {
        pbpVideosListElem.removeChild(pbpVideosListElem.firstChild);
    }
    // Repopulate list items.
    for (let idx = 0; idx < videoResults.length; idx++) {
        let result = videoResults[idx]
        let description : string = result["description"]
        let videoURL : string = result["medium_url"]
        console.log(description)
        console.log(videoURL)
        let listElem = document.createElement('li');
        listElem.innerText = description
        // Add click listener for each list item.
        listElem.addEventListener('click', () => {
            // delete current video player
            document.getElementById("php-video-player")?.remove()
            let videoHtml : string = `
<video
id="php-video-player"
class="video-js"
controls
autoplay
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
        })
        pbpVideosListElem.appendChild(listElem)
    }
}

try { init(); } catch (e) { console.error(e); }

function init() {
    createModal()
    updateStatCells()
    // var myModal : any = new Modal((document.getElementById('myModal') as any), {})
    // console.log(myModal)
    // console.log(bootstrap)
}

export {}