const API_HOST = "https://yahoo-fantasy-bball-stat-video.herokuapp.com"
const SELECTED_DATE = getSelectedDate()

// ATTRIBUTES_MAP key = Yahoo's Naming. Value = NBA's API Naming.
const ATTRIBUTES_MAP = {
    "Field Goals Made/Field Goals Attempted": ["FGM", "FGA"],
    "Free Throws Made/Free Throws Attempted": ["FGM", "FGA"],
    "3-point Shots Made": "FG3M",
    "Total Rebounds": "REB",
    "Assists": "AST",
    "Steals": "STL",
    "Blocked Shots": "BLK",
    "Turnovers": "TOV",
}

function getElementsByXpath(path, parent) {
    let results = [];
    let query = document.evaluate(path, parent || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    for (let i = 0, length = query.snapshotLength; i < length; ++i) {
        results.push(query.snapshotItem(i));
    }
    return results;
}

function getElementByXpath(path, parent) {
    return document.evaluate(path, parent || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

async function getVideos(url) {
    try {
        let res = await fetch(url, {method: 'GET'})
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

function createLink(playerName, teamAbbreviation, gameDate, statType) {
    let url = new URL(`${API_HOST}/playervideos`),
    params = {
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
    let valueURL = selectedDateElem.getAttribute("value") // e.g. "https://basketball.fantasysports.yahoo.com/nba/63851/1/team?pspid=782202516&activity=myteam&date=2021-10-28"
    const urlParams = new URLSearchParams(valueURL)
    return urlParams.get('date')
}

// getHeaderIndexes returns a map with the header names that map to their indexes.
function getHeaderIndexes() {
    let headerIndexMap = {}
    let headerElements = getElementsByXpath(`//table[@id="statTable0"]/thead/tr[2]/th`, null);
    for (var idx = 0; idx < headerElements.length; idx++) {
        elem = headerElements[idx]
        let elementTitle = elem.getAttribute("title")
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
        elem = playerCellElements[idx]
        let playerNameElem = getElementByXpath(`a[contains(@class, "name")]`, elem)
        let playerName = playerNameElem.innerText
        let playerTeamPosElem = getElementByXpath(`span[contains(text(), "-")]`, elem)
        let playerTeam = playerTeamPosElem.innerText.split("-")[0].trim()
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
            let statCellElem = getElementByXpath(`td[${colIndex+1}]/div`, playerRowElem)
            // console.log(`${yahooStatName}: td[${colIndex+1}]/div`)
            // console.log(statCellElem)
            let statValue = statCellElem.innerText
            // Skip cells where there's no stat.
            if (statValue == "-" || statValue == "0" || statValue == "-/-") {
                continue
            }
            // console.log(statValue)
            switch (yahooStatName) {
                case "Field Goals Made/Field Goals Attempted":
                case "Free Throws Made/Free Throws Attempted":
                    let nbaAPIStatNames = ATTRIBUTES_MAP[yahooStatName]
                    for (let statType in nbaAPIStatNames) {
                        let link = createLink(playerName, teamAbbreviation, SELECTED_DATE, statType)
                        makeCellClickable(statCellElem, link)
                    }
                default:
                    let statType = ATTRIBUTES_MAP[yahooStatName]
                    let link = createLink(playerName, teamAbbreviation, SELECTED_DATE, statType)
                    makeCellClickable(statCellElem, link)
            }
        }
    }
}

function makeCellClickable(element, link) {
    // `element` is the element you want to wrap
    var parent = element.parentNode;
    var wrapper = document.createElement('a');
    wrapper.style.cursor = "pointer"

    // set the wrapper as child (instead of the element)
    parent.replaceChild(wrapper, element);
    // set element as child of wrapper
    wrapper.appendChild(element);

    wrapper.addEventListener('click', function(){
        console.log(link);
    })
}