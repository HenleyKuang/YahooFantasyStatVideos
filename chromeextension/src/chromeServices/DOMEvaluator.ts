// import Modal from 'bootstrap/js/dist/modal';
// import './modules/bootstrap.bundle.js'
import MicroModal from './modules/micromodal.min.js';

// const API_HOST = "https://yahoo-fantasy-bball-stat-video.herokuapp.com"
const API_HOST = "http://localhost:3000"
const MODAL_CONFIG = {
    // onShow: (modal : any) => console.info(`${modal.id} is shown`), // [1]
    onClose: () => {
        (document.getElementById("php-video-player") as HTMLVideoElement).pause()
    }, // [2]
    openTrigger: 'data-micromodal-open', // [3]
    closeTrigger: 'data-micromodal-close', // [4]
    openClass: 'is-open', // [5]
    disableScroll: false, // [6]
    disableFocus: false, // [7]
    awaitOpenAnimation: false, // [8]
    awaitCloseAnimation: false, // [9]
    debugMode: false // [10]
}

var SELECTED_DATE: any = getSelectedDate()
var PAGE_TYPE: string = "";
const PAGE_TYPE_YAHOO_FANTASY_TEAM_PAGE: string = "PAGE_TYPE_FANTASY_TEAM_PAGE";
const PAGE_TYPE_YAHOO_BOX_SCORE: string = "PAGE_TYPE_YAHOO_BOX_SCORE";

var currentSelectedListElem = document.createElement('li');;

// TEAM_PAGE_ATTRIBUTES_MAP key = Yahoo's Naming. Value = NBA's API Naming.
// const TEAM_PAGE_ATTRIBUTES_MAP : { [key: string]: string | string[] } = {
const TEAM_PAGE_ATTRIBUTES_MAP: { [key: string]: string } = {
    // "FGM/A*": ["FGM", "FGA"],
    // "FTM/A*": ["FTM", "FTA"],
    "FGM/A*": "FGA",
    // "FTM/A*": "FTA", // FT doesn't exist in nbaapi.
    // "PTS": "FGM", // This could be confusing since PTS will be missing the FTM.
    "3PTM": "FG3M",
    "REB": "REB",
    "AST": "AST",
    "ST": "STL",
    "BLK": "BLK",
    "TO": "TOV",
}

// TEAM_PAGE_ATTRIBUTES_MAP key = Yahoo's Box Score Naming. Value = NBA's API Naming.
// const TEAM_PAGE_ATTRIBUTES_MAP : { [key: string]: string | string[] } = {
const BOX_SCORE_ATTRIBUTES_MAP: { [key: string]: string } = {
    // "FGM/A*": ["FGM", "FGA"],
    // "FTM/A*": ["FTM", "FTA"],
    "FGM/A*": "FGA",
    // "FTM/A*": "FTA", // FT doesn't exist in nbaapi.
    // "PTS": "FGM", // This could be confusing since PTS will be missing the FTM.
    "3PTM": "FG3M",
    "REB": "REB",
    "AST": "AST",
    "STL": "STL",
    "BLK": "BLK",
    "TO": "TOV",
}

// WIDGET_ATTRIBUTES_MAP key = Yahoo's Naming. Value = NBA's API Naming.
// const WIDGET_ATTRIBUTES_MAP : { [key: string]: string | string[] } = {
const WIDGET_ATTRIBUTES_MAP: { [key: string]: string } = {
    "FG%": "FGA",
    "3PTM": "FG3M",
    "REB": "REB",
    "AST": "AST",
    "ST": "STL",
    "BLK": "BLK",
    "TO": "TOV",
}

const RENAME_TEAM_ABBREV: { [key: string]: string } = {
    "PHO": "PHX",
    "NY": "NYK",
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
        let res = await fetch(url, { method: 'GET' })
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

function createLink(playerName: string, teamAbbreviation: string, gameDate: string, statType: string) {
    let url = new URL(`${API_HOST}/playervideos`)
    let params: { [key: string]: string } = {
        playerName: playerName, //"De'Anthony Melton",
        teamAbbreviation: teamAbbreviation, // "MEM",
        gameDate: gameDate, // "2021-10-26",
        statType: statType, // "STL",
    }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    return url.toString()
}

function parseHTMLTableElem(tableEl: HTMLElement, headerSelector: string, rowElems: (Node | null)[]) {
    const columns = Array.from(tableEl.querySelectorAll(headerSelector)).map(it => it.textContent)
    const rows = rowElems
    // console.log(columns)
    // console.log(rows)
    return Array.from(rows).map(row => {
        const cells: any = Array.from(getElementsByXpath(`(th|td)[not(.//a[contains(@title, "Watch List")])]`, row))
        // console.log(cells)
        return columns.reduce((obj: any, col: any, idx: any) => {
            if (PAGE_TYPE == PAGE_TYPE_YAHOO_BOX_SCORE) {
                // For yahoo box score page, rename some columns.
                if (col.includes("Starters") || col.includes("Bench")) {
                    col = "Players"
                } else {
                    // For yahoo box score page, we'll also capitalize the other columns which should be all stat names
                    col = col.toUpperCase()
                }
            }
            obj[col] = {
                "innerText": cells[idx].innerText,
                "elem": cells[idx],
            }
            return obj
        }, {})
    })
}

/* Converts 'Wed, Oct 16, 2024' to "2024-10-16" */
function convertToISODate(givenDate: string) {
    const date = new Date(givenDate);
    const formattedDate = date.toISOString().slice(0, 10);
    return formattedDate
}

async function getSelectedDate() {
    /* Selected date from team page */
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
    if (urlParams.get('date')) {
        PAGE_TYPE = PAGE_TYPE_YAHOO_FANTASY_TEAM_PAGE
        return urlParams.get('date')
    }
    return ""
}

async function getSelectedDateFromBoxScorePage() {
    /* Selected date from Yahoo box score page */
    let wordyDateElem = getElementByXpath('//div[@id="Col2-0-GameBlurb-Proxy"]//dd[contains(.//span, "Date")]//span[not(contains(text(), "Date"))]', null)
    if (wordyDateElem == null) {
        return ""
    }
    if (!(wordyDateElem as HTMLElement).innerText.includes(", ")) {
        return ""
    }
    PAGE_TYPE = PAGE_TYPE_YAHOO_BOX_SCORE
    return convertToISODate((wordyDateElem as HTMLElement).innerText) // innerText is for example 'Wed, Oct 16, 2024'
}

async function updateStatCellsForYahooFantasyTeamPage() {
    console.log("Start updating stats cells for PAGE_TYPE_YAHOO_FANTASY_TEAM_PAGE")
    let tableElem: any = document.querySelector("#statTable0")
    if (tableElem == null) {
        console.log("[updateStatCellsForYahooFantasyTeamPage] can't find the team stats table.")
        return
    }
    const rowElems = tableElem.querySelectorAll('tbody > tr')
    let playerDataList = parseHTMLTableElem(tableElem, 'tr.Alt.Last > th', rowElems)
    for (let playerRowIdx = 0; playerRowIdx < playerDataList.length; playerRowIdx++) {
        let playerData = playerDataList[playerRowIdx]
        if (!playerData.Status["innerText"].startsWith("W, ") && !playerData.Status["innerText"].startsWith("L, ")) {
            // Skip games that have not ended.
            continue
        }
        let playerName = (getElementByXpath(`.//a[contains(@class, "name")]`, playerData.Players["elem"]) as HTMLElement).innerText
        // console.log(playerName)
        // e.g. team Element = "MEM - PG,SG" -- after split & trim, "MEM"
        let teamAbbreviation = (getElementByXpath(`.//span[contains(text(), " - ")]`, playerData.Players["elem"]) as HTMLElement).innerText.split("-")[0].trim()
        // console.log(teamAbbreviation)
        for (let [yahooStatName, nbaAPIStatName] of Object.entries(TEAM_PAGE_ATTRIBUTES_MAP)) {
            let statValue = playerData[yahooStatName]["innerText"]
            let statCellElem: any = getElementByXpath(`div`, playerData[yahooStatName]["elem"])
            // Skip cells where there's no stat.
            if (statValue === "-" || statValue === "0" || statValue === "-/-" || statValue === "0/0") {
                // console.log(`"Skipping ${playerName} ${yahooStatName}`)
                continue
            }
            switch (yahooStatName) {
                // case "FGM/A*":
                // case "FGT/A*": // @ts-ignore
                //     // TODO(henleyk): Support FGM/A and FTM/A. These require additional logic to parse and inject 2 links.
                //     break
                default:
                    console.log("[updateStatCellsForYahooFantasyTeamPage] Making cell clickable: " + yahooStatName)
                    makeCellClickable(statCellElem, playerName, teamAbbreviation, (nbaAPIStatName as string), statValue, yahooStatName)
            }
        }
    }
}

async function updateStatCellsForYahooBoxScores() {
    console.log("Start updating stats cells for PAGE_TYPE_YAHOO_BOX_SCORE")
    // Sometimes, there are 4 tables. Home Starters + Bench, Away Starters + Bench tables
    let tableElems: NodeListOf<HTMLTableElement> | undefined = document.querySelector(".match-stats")?.querySelectorAll("table")
    if (tableElems == undefined) {
        console.log("[updateStatCellsForYahooBoxScores] can't find the team stats tables.")
        return
    }
    if (tableElems.length > 4) {
        console.log("[updateStatCellsForYahooBoxScores] more than 4 tables found.")
        return
    }
    let teamNameElems: any = getElementsByXpath('//div[contains(@class, "linescore")]//tbody//td[./img]', null)
    if (teamNameElems == null && teamNameElems.length >= 2) {
        console.log("[updateStatCellsForYahooBoxScores] can't team names.")
        return
    }
    let awayTeamAbbrev = (teamNameElems[0] as HTMLElement).innerText
    if (RENAME_TEAM_ABBREV[awayTeamAbbrev] != null) {
        awayTeamAbbrev = RENAME_TEAM_ABBREV[awayTeamAbbrev]
    }
    let homeTeamAbbrev = (teamNameElems[1] as HTMLElement).innerText
    if (RENAME_TEAM_ABBREV[homeTeamAbbrev] != null) {
        homeTeamAbbrev = RENAME_TEAM_ABBREV[homeTeamAbbrev]
    }
    // console.log(awayTeamAbbrev)
    // console.log(homeTeamAbbrev)
    let tableTeamNames = [awayTeamAbbrev, homeTeamAbbrev, awayTeamAbbrev, homeTeamAbbrev]
    for (let tableElemIdx = 0; tableElemIdx < tableElems.length; tableElemIdx++) {
        let tableElem = tableElems[tableElemIdx]
        let rowElems = getElementsByXpath('.//tbody//tr[not(contains(.//th, "Totals"))]', tableElem)
        // console.log(rowElems)
        if (rowElems == null || rowElems.length == 0 || rowElems[0] == null) {
            console.log("[updateStatCellsForYahooBoxScores] Couldn't find the table rows")
            continue
        }
        let playerDataList = parseHTMLTableElem(tableElem, 'thead > tr > th', rowElems)
        // console.log(playerDataList)
        for (let playerRowIdx = 0; playerRowIdx < playerDataList.length; playerRowIdx++) {
            let playerData = playerDataList[playerRowIdx]
            // console.log(playerData)
            let playerName = (getElementByXpath(`.//a[contains(@href, "/nba/players/")]`, playerData.Players["elem"]) as HTMLElement).innerText
            // console.log(playerName)
            let teamAbbreviation = tableTeamNames[tableElemIdx]
            // console.log(teamAbbreviation)
            for (let [yahooStatName, nbaAPIStatName] of Object.entries(BOX_SCORE_ATTRIBUTES_MAP)) {
                if (playerData[yahooStatName] == null) {
                    continue
                }
                let statValue = playerData[yahooStatName]["innerText"]
                let statCellElem: any = playerData[yahooStatName]["elem"]
                // Skip cells where there's no stat.
                if (statValue === "-" || statValue === "0" || statValue === "-/-" || statValue === "0/0") {
                    // console.log(`"Skipping ${playerName} ${yahooStatName}`)
                    continue
                }
                switch (yahooStatName) {
                    // case "FGM/A*":
                    // case "FGT/A*": // @ts-ignore
                    //     // TODO(henleyk): Support FGM/A and FTM/A. These require additional logic to parse and inject 2 links.
                    //     break
                    default:
                        makeCellClickableV2(statCellElem, playerName, teamAbbreviation, (nbaAPIStatName as string), statValue, yahooStatName)
                }
            }
        }
    }
}

function injectPlayerNotesAction() {
    let playerTableCells: any = getElementsByXpath("//td[contains(@class, 'Alt') and contains(@class, 'Ta-start') and contains(@class, 'player')]", null)
    for (let idx = 0; idx < playerTableCells.length; idx++) {
        let playerTableCell = playerTableCells[idx]
        let playerNoteButton: any = getElementByXpath(".//a[contains(@class, 'playernote')]", playerTableCell)
        let playerName = (getElementByXpath(`.//a[contains(@class, "name")]`, playerTableCell) as HTMLElement).innerText
        // e.g. team Element = "MEM - PG,SG" -- after split & trim, "MEM"
        let teamAbbreviation = (getElementByXpath(`.//span[contains(text(), " - ")]`, playerTableCell) as HTMLElement).innerText.split("-")[0].trim()
        playerNoteButton.addEventListener('click', async (e: any) => {
            console.log(`player Note button clicked for ${playerName} - ${teamAbbreviation}`)
            updateNewsPopupStatCells(playerName, teamAbbreviation);
        });
    }
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const MONTH_NAME_TO_NUM: any = {
    'Jan': '01',
    'Feb': '02',
    'Mar': '03',
    'Apr': '04',
    'May': '05',
    'Jun': '06',
    'Jul': '07',
    'Aug': '08',
    'Sep': '09',
    'Oct': '10',
    'Nov': '11',
    'Dec': '12',
}

function n(n: number) {
    return n > 9 ? "" + n : "0" + n;
}

// e.g. convert 'Nov 5' to 2021-11-05
function formatWidgetDate(date: string): string {
    let [month_name, month_day]: any = date.split(" ")
    let month_num = MONTH_NAME_TO_NUM[month_name]
    return `2021-${month_num}-${n(parseInt(month_day))}`
}

async function waitUntilWidgetPopsUp() {
    await sleep(200);
    let xpath: string = "//div[contains(@class, 'yui3-widget') and not(contains(@class, 'yui3-ysplayernote-hidden'))]/div[contains(@class, 'yui3-widget-hd')]"
    let widgetElem: any = getElementByXpath(xpath, null)
    while (widgetElem == null) {
        await sleep(200);
        widgetElem = getElementByXpath(xpath, null)
    }
}

async function waitUntilTeamTableVisible() {
    await sleep(200)
    let widgetElem: any = document.querySelector("table.teamtable")
    while (widgetElem == null) {
        await sleep(200);
        widgetElem = document.querySelector("table.teamtable")
    }
}

async function updateNewsPopupStatCells(playerName: string, teamAbbreviation: string) {
    await waitUntilWidgetPopsUp()
    await waitUntilTeamTableVisible()
    let tableElem: any = document.querySelector("table.teamtable")
    if (tableElem == null) {
        console.log("table.teamtable not found")
        return
    }
    let rowElems = tableElem.querySelectorAll('tbody > tr')
    let playerDataList = parseHTMLTableElem(tableElem, 'tr > th', rowElems)
    for (let playerRowIdx = 0; playerRowIdx < playerDataList.length; playerRowIdx++) {
        let playerData = playerDataList[playerRowIdx]
        console.log(playerData)
        if (!playerData.Status["innerText"].startsWith("W, ") && !playerData.Status["innerText"].startsWith("L, ")) {
            // Skip games that have not ended.
            continue
        }
        for (let [yahooStatName, nbaAPIStatName] of Object.entries(WIDGET_ATTRIBUTES_MAP)) {
            let statValue = playerData[yahooStatName]["innerText"]
            let statCellElem: any = playerData[yahooStatName]["elem"]
            let statDate: any = formatWidgetDate(playerData["Date"]["innerText"])
            // Skip cells where there's no stat.
            if (statValue === "-" || statValue === "0" || statValue === "-/-" || statValue === "0/0" || statValue === "") {
                // console.log(`"Skipping ${playerName} ${yahooStatName}`)
                continue
            }
            switch (yahooStatName) {
                // case "FGM/A*":
                // case "FGT/A*": // @ts-ignore
                //     // TODO(henleyk): Support FGM/A and FTM/A. These require additional logic to parse and inject 2 links.
                //     break
                default:
                    console.log(`Making clickable: ${statCellElem}, ${yahooStatName}`)
                    makeWidgetCellClickable(statCellElem, playerName, teamAbbreviation, (nbaAPIStatName as string), statValue, yahooStatName, statDate)
            }
        }
    }
}

function getOffset(el: any) {
    const rect = el.getBoundingClientRect();
    return {
        left: rect.right + window.scrollX,
        top: rect.top + window.scrollY
    };
}

// makeCellClickable for widget
function makeWidgetCellClickable(element: Node, playerName: string, teamAbbreviation: string, statType: string, statValue: string, yahooStatName: string, statDate: string) {
    (element as HTMLElement).innerText = ""

    // `element` is the element you want to wrap
    var linkElement = document.createElement('a');
    linkElement.style.cursor = "pointer"
    linkElement.innerText = statValue

    element.appendChild(linkElement);

    let link = createLink(playerName, teamAbbreviation, statDate, statType)

    linkElement.addEventListener('click', async (e: any) => {
        (document.querySelector("#php-video-player > source") as HTMLElement).setAttribute("src", "");
        (document.querySelector("#loading-img") as HTMLElement).style.display = "inline"
        // adjust location of modal to left side of the stat clicked.
        let offset = getOffset(e.target)
        let modalContainer = (document.getElementById("modal-1-container") as HTMLElement)
        // Show the modal with loading screen.
        MicroModal.show('modal-1', MODAL_CONFIG);
        modalContainer.style.left = (offset.left - modalContainer.offsetWidth - 30).toString() + "px"
        modalContainer.style.top = (offset.top - modalContainer.offsetHeight / 2).toString() + "px"
        // Update modal data.
        let videoResults: any[] = await getVideos(link)
        updateModalDisplayData(playerName, teamAbbreviation, yahooStatName, statValue, videoResults);
        (document.querySelector("#loading-img") as HTMLElement).style.display = "none"
        // click first video in the list to start trigger video playing.
        currentSelectedListElem.click()
    })
}

// makeCellClickable for team page
function makeCellClickable(element: Node, playerName: string, teamAbbreviation: string, statType: string, statValue: string, yahooStatName: string) {
    // FGM/A* and FTM/A* has a span child element with a faded text class. Set the color explicitly to blue like a link.
    let spanChild = (element as HTMLElement).querySelector("span")
    if (spanChild) {
        spanChild.style.color = "#0078FF"
    }
    // `element` is the element you want to wrap
    let parent: any = element.parentNode;
    var wrapper = document.createElement('a');
    wrapper.style.cursor = "pointer"

    // set the wrapper as child (instead of the element)
    parent.replaceChild(wrapper, element);
    // set element as child of wrapper
    wrapper.appendChild(element);

    let link = createLink(playerName, teamAbbreviation, SELECTED_DATE, statType)

    wrapper.addEventListener('click', async (e: any) => {
        console.log(link);
        // Clear previous data.
        deleteVideoListInModal();
        (document.querySelector("#php-video-player > source") as HTMLElement).setAttribute("src", "");
        (document.querySelector("#loading-img") as HTMLElement).style.display = "inline"
        // adjust location of modal to left side of the stat clicked.
        let offset = getOffset(e.target)
        console.log(offset)
        let modalContainer = (document.getElementById("modal-1-container") as HTMLElement)
        // Show the modal with loading screen.
        MicroModal.show('modal-1', MODAL_CONFIG);
        modalContainer.style.left = (offset.left - modalContainer.offsetWidth - 30).toString() + "px"
        modalContainer.style.top = (offset.top - modalContainer.offsetHeight / 2).toString() + "px"
        // Update modal data.
        let videoResults: any[] = await getVideos(link)
        console.log(videoResults)
        updateModalDisplayData(playerName, teamAbbreviation, yahooStatName, statValue, videoResults);
        (document.querySelector("#loading-img") as HTMLElement).style.display = "none"
        // click first video in the list to start trigger video playing.
        currentSelectedListElem.click()
    })
}

// makeCellClickableV2 for box score page
function makeCellClickableV2(element: Node, playerName: string, teamAbbreviation: string, statType: string, statValue: string, yahooStatName: string) {
    var wrapper = document.createElement('a');
    wrapper.style.cursor = "pointer"
    wrapper.style.color = "#0078FF"
    wrapper.innerText = statValue;

    // set element as child of wrapper
    (element as HTMLElement).innerText = ""
    element.appendChild(wrapper);

    let link = createLink(playerName, teamAbbreviation, SELECTED_DATE, statType)

    wrapper.addEventListener('click', async (e: any) => {
        // console.log(link);
        // Clear previous data.
        deleteVideoListInModal();
        (document.querySelector("#php-video-player > source") as HTMLElement).setAttribute("src", "");
        (document.querySelector("#loading-img") as HTMLElement).style.display = "inline"
        // adjust location of modal to left side of the stat clicked.
        let offset = getOffset(e.target)
        let modalContainer = (document.getElementById("modal-1-container") as HTMLElement)
        // Show the modal with loading screen.
        MicroModal.show('modal-1', MODAL_CONFIG);
        modalContainer.style.left = (offset.left - modalContainer.offsetWidth - 30).toString() + "px"
        modalContainer.style.top = (offset.top - modalContainer.offsetHeight / 2).toString() + "px"
        // Update modal data.
        let videoResults: any[] = await getVideos(link)
        // console.log(videoResults)
        updateModalDisplayData(playerName, teamAbbreviation, yahooStatName, statValue, videoResults);
        (document.querySelector("#loading-img") as HTMLElement).style.display = "none"
        // click first video in the list to start trigger video playing.
        currentSelectedListElem.click()
    })
}

async function createModal() {
    let loadingImgSrc = chrome.runtime.getURL("ball-triangle.svg")
    let modalHtml: string = `
<div class="modal micromodal-slide" id="modal-1" aria-hidden="true">
<div class="modal__overlay" tabindex="-1" data-micromodal-close></div>
<div class="modal__container" id="modal-1-container" role="dialog" aria-modal="true" aria-labelledby="modal-1-title">
    <header class="modal__header">
      <h4 class="modal__title" id="modal-1-title"></h4>
      <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>
    </header>
    <main class="modal__content" id="modal-1-content">
      <img id="loading-img" src="${loadingImgSrc}" />
      <ol class="list-group list-group-numbered pbp-videos-list" id="pbp-videos-list"></ol>
      <div id="php-video-container">
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
            <source src="" type="video/mp4" />
            <p class="vjs-no-js">
                To view this video please enable JavaScript, and consider upgrading to a web browser that
                <a href="https://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
            </p>
        </video>
      </div>
    </main>
    <footer class="modal__footer">
    </footer>
</div>
</div>
    `
    var div = document.createElement('div');
    div.innerHTML = modalHtml.trim();
    let modalElem = div.firstChild;
    // let outwrapperElem: any = document.getElementById("outer-wrapper")
    // let outwrapperElem: any = document.getElementsByTagName("body")[0]
    let outwrapperElem: any = document.documentElement;
    outwrapperElem.appendChild(modalElem)
    MicroModal.init(MODAL_CONFIG)
}

function deleteVideoListInModal() {
    let pbpVideosListElem = document.getElementById("pbp-videos-list")
    if (pbpVideosListElem == null) {
        console.log("couldn't find videos list element")
        return
    }
    // Delete all list items.
    while (pbpVideosListElem.firstChild) {
        pbpVideosListElem.removeChild(pbpVideosListElem.firstChild);
    }
}

async function updateModalDisplayData(playerName: string, teamAbbreviation: string, yahooStatName: string, statValue: string, videoResults: any[]) {
    // Update modal title to Player Name and the stat title.
    let statTitle = statValue + " " + yahooStatName // e.g. 4 3-point Shots Made
    let modalTitleElem: any = document.getElementById("modal-1-title")
    modalTitleElem.innerText = playerName + " - " + statTitle
    // Update Header to Show Player Photo.
    // TODO(henleyk)
    // Update Body to Show List of Videos Links.
    deleteVideoListInModal()
    let pbpVideosListElem = (document.getElementById("pbp-videos-list") as HTMLElement)
    let allListElem: HTMLElement[] = new Array(videoResults.length);
    // Repopulate list items.
    for (let idx = videoResults.length - 1; idx >= 0; idx--) {
        let result = videoResults[idx]
        let description: string = result["description"]
        let videoURL: string = result["medium_url"]
        // console.log(description)
        // console.log(videoURL)
        let listElem = document.createElement('li');
        listElem.innerText = description
        listElem.style.cursor = "pointer"
        listElem.classList.add("list-group-item", "list-group-item-action")
        if (idx == 0) {
            listElem.classList.add("active")
            listElem.setAttribute("aria-current", "true")
            currentSelectedListElem = listElem
        }
        // Add click listener for each list item to update it's attributes.
        listElem.addEventListener('click', function () {
            currentSelectedListElem.removeAttribute("aria-current")
            currentSelectedListElem.classList.remove("active")
            this.setAttribute("aria-current", "true")
            this.classList.add("active")
            currentSelectedListElem = this
        })
        // Add click listener for each list item to update video player.
        listElem.addEventListener('click', (e) => {
            // delete current video player
            document.getElementById("php-video-player")?.remove()
            let videoHtml: string = `
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
            if (idx != videoResults.length - 1) {
                console.log("Added listener")
                videoElem?.addEventListener('ended', () => {
                    allListElem[idx + 1].click()
                }, false);
            }
            let phpVideoContainerElem: any = document.getElementById("php-video-container")
            phpVideoContainerElem.appendChild(videoElem)
        })
        pbpVideosListElem.insertBefore(listElem, pbpVideosListElem.firstChild)
        allListElem[idx] = listElem
    }
}

try { init(); } catch (e) { console.error(e); }

function init() {
    (async function getSelectedDateLoop() {
        let selectedDate = await getSelectedDate();
        if (selectedDate == "") {
            selectedDate = await getSelectedDateFromBoxScorePage();
        }
        if (selectedDate == "") {
            setTimeout(getSelectedDateLoop, 200);
        } else {
            SELECTED_DATE = selectedDate;
            console.log("Selected date is: " + SELECTED_DATE)
            console.log("PAGE_TYPE is " + PAGE_TYPE);
            console.log("Start creating modal")
            await createModal()
            console.log("Created modal")
            if (PAGE_TYPE == PAGE_TYPE_YAHOO_FANTASY_TEAM_PAGE) {
                updateStatCellsForYahooFantasyTeamPage()
            }
            if (PAGE_TYPE == PAGE_TYPE_YAHOO_BOX_SCORE) {
                updateStatCellsForYahooBoxScores()
            }
            // injectPlayerNotesAction()
        }
    })();
}

export { }