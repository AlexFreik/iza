const props = PropertiesService.getScriptProperties();

const SSID = props.getProperty('SSID');
const REG_TAB_NAME = 'Registrations';

const ZOOM_ACCOUNT_ID = props.getProperty('ZOOM_ACCOUNT_ID');
const ZOOM_CLIENT_ID = props.getProperty('ZOOM_CLIENT_ID');
const ZOOM_CLIENT_SECRET = props.getProperty('ZOOM_CLIENT_SECRET');
const ZOOM_OAUTH_ENDPOINT = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

const SHEET_UPDATE_MARGIN = 100;

const zoomMeetings = {
    english: {
        batch1: '123',
        batch2: '123',
    },
    hindi: {
        batch1: '123',
        batch2: '123',
    },
    tamil: {
        batch1: null,
        batch2: null,
    },
    telugu: {
        batch1: null,
        batch2: null,
    },
};

// ===== Utils =====
function getMinMax(arr) {
    if (arr.length === 0) {
        return null;
    }
    let min = arr[0];
    let max = arr[0];
    for (let i = 0; i < arr.length; i++) {
        min = arr[i] < min ? arr[i] : min;
        max = arr[i] > max ? arr[i] : max;
    }
    return { min: min, max: max };
}

function getBatches(lang) {
    const meetingId1 = zoomMeetings[lang].batch1;
    const meetingId2 = zoomMeetings[lang].batch2;
    if (!meetingId1 || !meetingId2) {
        return null;
    }
    return [meetingId1, meetingId2];
}

// ===== Sheet ======
class User {
    constructor(row, rowNum) {
        this.row = rowNum;
        this.email = row[0].toLowerCase();
        this.name = row[1];
        this.lang = row[2].toLowerCase();
        this.links = [row[User.LINK1_COL - 1], row[User.LINK2_COL - 1]];
        this.progress = row[6];
    }

    get firstName() {
        const firstName = this.name.trim().split(' ')[0];
        if (firstName === '') {
            throw new Error('[Error] Invalid data, name is not defined for ' + this.email);
        }
        return firstName;
    }

    get lastName() {
        return this.name.trim().slice(this.firstName.length).trim();
    }
}
User.LINK1_COL = 5;
User.LINK2_COL = 6;

function getUsers(startRow = 2, numRows = null) {
    if (numRows === 0) {
        return [];
    }
    const sheet = SpreadsheetApp.openById(SSID).getSheetByName(REG_TAB_NAME);
    const remainingRows = sheet.getLastRow() - startRow + 1;
    let num = numRows === null ? remainingRows : Math.min(remainingRows, numRows);
    const users = sheet
        .getRange(startRow, 1, num, sheet.getLastColumn())
        .getValues()
        .map((row, i) => new User(row, i + 2));

    const emails = users.map((user) => user.email);
    const emailsSet = new Set(emails);
    if (emails.length !== emailsSet.size) {
        throw new Error('[Error] Invalid data, emails have duplicates...');
    }

    return users;
}

function updateSheetZoomLinks(users) {
    if (users.length === 0) {
        return;
    }
    const sheet = SpreadsheetApp.openById(SSID).getSheetByName(REG_TAB_NAME);

    const rowRange = getMinMax(users.map((u) => u.row));
    const colRange = { min: User.LINK1_COL, max: User.LINK2_COL };
    const range = sheet.getRange(
        rowRange.min,
        colRange.min,
        rowRange.max - rowRange.min + 1,
        colRange.max - colRange.min + 1,
    );
    const data = range.getValues();

    users.forEach((u) => {
        data[u.row - rowRange.min] = u.links;
    });
    range.setValues(data);
}

// ===== Zoom Auth Token ======
class Token {
    constructor(token, expiry, error) {
        this.token = token;
        this.expiry = expiry;
        this.error = error;
    }
}

function generateToken() {
    const url =
        ZOOM_OAUTH_ENDPOINT + '?grant_type=account_credentials&account_id=' + ZOOM_ACCOUNT_ID;
    const expiry = Date.now() + 60 * 60 * 1000;

    const headers = {
        Authorization: 'Basic ' + Utilities.base64Encode(ZOOM_CLIENT_ID + ':' + ZOOM_CLIENT_SECRET),
    };
    const options = {
        method: 'post',
        headers: headers,
    };
    try {
        const res = UrlFetchApp.fetch(url, options);
        // console.log(JSON.parse(res.getContentText()).access_token);
        console.log('Successefully generated a new Zoom access token.');
        return new Token(JSON.parse(res.getContentText()).access_token, expiry, null);
    } catch (e) {
        console.log(e);
        return new Token(null, null, e.toString());
    }
}

function getToken() {
    const props = PropertiesService.getScriptProperties();
    let token = props.getProperty('token');
    if (token !== null) {
        token = JSON.parse(token);
        if (token.error !== null) {
            throw new Error('[Internal Error] Token is invalid: ' + token.error);
        }
    }

    if (token === null || token.expiry < Date.now() + 60 * 1000) {
        const newToken = generateToken();
        if (newToken.error === null) {
            props.setProperty('token', JSON.stringify(newToken));
        }
        return newToken;
    }

    return token;
}

// ===== Zoom Meeting Registration ======
function registerUser(user, meetingId) {
    if (!user || !meetingId) {
        throw new Error('[Internal Error] Invalid arguments: ' + user + ', ' + meetingId);
    }

    const token = getToken();
    if (token.error) {
        throw new Error(token.error);
    }

    const url = ZOOM_API_BASE_URL + '/meetings/' + meetingId + '/registrants';
    const headers = { Authorization: 'Bearer ' + token.token };
    const payload = {
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        auto_approve: true,
    };
    const options = {
        method: 'post',
        contentType: 'application/json',
        headers: headers,
        muteHttpExceptions: false,
        payload: JSON.stringify(payload),
    };

    try {
        const res = UrlFetchApp.fetch(url, options);
        const r = JSON.parse(res);
        return { link: r.join_url, error: null };
    } catch (e) {
        return { link: null, error: e.toString() };
    }
}

// ===== Complete Function =====
function registerAll(limit = 400) {
    const users = getUsers(2, limit).filter(
        (u) =>
            u.progress !== 'Course Completed' &&
            Object.keys(zoomMeetings).includes(u.lang) &&
            (u.links[0] === '' || u.links[1] === ''),
    );

    users.forEach((u) => {
        if (u.links[0] !== '' || u.links[1] !== '') {
            throw new Error('[Error] links must be all set or unset: ' + u.email);
        }
    });

    console.log(users.map((u) => u.email));

    const registrants = [];
    users.forEach((u) => {
        const batches = getBatches(u.lang);
        if (batches === null) {
            return; // this language is not yet configured
        }
        for (let i = 0; i < batches.length; ++i) {
            const res = registerUser(u, batches[i]);
            if (res.error) {
                console.log('Error registering user', res.error);
                return;
            }
            u.links[i] = res.link;
        }
        registrants.push(u);
        if (registrants.length >= SHEET_UPDATE_MARGIN) {
            updateSheetZoomLinks(registrants);
            registrants.length = 0;
        }
    });
    updateSheetZoomLinks(registrants);
}
