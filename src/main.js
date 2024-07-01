class User {
    constructor(row, data) {
        console.assert(data.length === 18);

        this.row = row;
        this.email = data[0];
        this.name = data[1];
        this.lang = data[2];
        this.batch = data[3];
        this.zoomLink = data[4];
        this.progress = data[5];
        this.attendance = data.slice(6, 18);
    }
}

class Session {
    constructor(data) {
        console.assert(data.length === 6);

        this.lang = data[0];
        this.date = data[1];
        this.name = data[3];
        this.batch = data[4];
        this.time = new Date(data[5]);

        this.start = combineDateAndTime(this.date, this.time);
    }
}

// ===== Utils =====
function combineDateAndTime(date, time) {
    const ans = new Date(date);
    ans.setHours(time.getHours(), time.getMinutes());
    return ans;
}

function toISTString(date) {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
    });
}

function toIST(date) {
    const year = date.toLocaleString('en-US', { year: 'numeric', timeZone: 'Asia/Kolkata' });
    const month = date.toLocaleString('en-US', { month: 'numeric', timeZone: 'Asia/Kolkata' });
    const day = date.toLocaleString('en-US', { day: 'numeric', timeZone: 'Asia/Kolkata' });
    const hour = date.toLocaleString('en-US', {
        hour12: false,
        hour: 'numeric',
        timeZone: 'Asia/Kolkata',
    });
    const minute = date.toLocaleString('en-US', { minute: 'numeric', timeZone: 'Asia/Kolkata' });

    return {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute),
    };
}

function setLoginError(msg) {
    const errorDiv = document.getElementById('email-not-found');
    errorDiv.innerHTML = msg;
}

function setRoot(htmlStr) {
    const root = document.getElementById('root');
    root.innerHTML = htmlStr;
}

function setNavbarRight(htmlStr) {
    const elem = document.getElementById('navbar-right');
    elem.innerHTML = htmlStr;
}

function fetchUser(email, f) {
    google.script.run
        .withFailureHandler((e) => {
            return f(null, "[Internal Error] Couldn't fetch details: " + e.toString());
        })
        .withSuccessHandler((resStr) => {
            let res = {};
            try {
                res = JSON.parse(resStr);
            } catch (e) {
                return f(null, "[Internal Error] Couldn't parse response: " + e.toString());
            }

            if (res.error === 'USER_NOT_FOUND') {
                return f(
                    null,
                    `[Error] There are no registrations for this email.
                            Please check the spelling or use a different email 🙏`,
                );
            } else if (res.error) {
                return f(null, '[Error]: ' + res.error);
            }
            return f(new User(res.row, res.data), null);
        })
        .getUserByEmail(email);
}

function setUserBatch(user, batch, f) {
    google.script.run
        .withFailureHandler((e) => {
            return f("[Internal Error] Couldn't select time batch: " + e.toString());
        })
        .withSuccessHandler((resStr) => {
            let res = {};
            try {
                res = JSON.parse(resStr);
            } catch (e) {
                return f("[Internal Error] Couldn't parse response: " + e.toString());
            }

            if (res.error === 'BATCH_NOT_FOUND') {
                return f(`[Client Error] Batch ${batch} doesn't exist 🙏`);
            } else if (res.error) {
                return f('[Error] ' + res.error);
            }

            return f(null);
        })
        .setUserBatch(user.row, batch);
}

function fetchSessions(f) {
    google.script.run
        .withFailureHandler((e) => {
            return f(null, "[Internal Error] Couldn't fetch sessions: " + e.toString());
        })
        .withSuccessHandler((resStr) => {
            let res = {};
            try {
                res = JSON.parse(resStr);
            } catch (e) {
                return f(null, "[Internal Error] Couldn't parse response: " + e.toString());
            }

            if (res.error) {
                return f(null, '[Error] ' + res.error);
            }

            const sessions = res.sessions
                .slice(1)
                .map((row) => new Session(row))
                .sort((a, b) => a.start.getTime() - b.start.getTime());
            return f(sessions, null);
        })
        .getSessions();
}

// ===== Actions =====
function logInClick() {
    const email = document.getElementById('email-input').value.toLowerCase().trim();
    if (email === '') {
        return renderLoginPage('', '[Error] Please enter valid email 🙏');
    }
    localStorage.setItem('email', email);

    renderLoadingPage();
    fetchUser(email, (user, error) => {
        if (error) {
            return renderLoginPage(email, error);
        }
        console.assert(user);
        currentUser = user;
        fetchSessions((sessions, error) => {
            if (error) {
                return renderLoginPage(email, error);
            }
            console.assert(sessions);
            currentSessions = sessions;
            if (user.batch === '') {
                return renderBatchSelectionPage(user, sessions, error);
            }
            return renderSessionsPage(user, sessions, error);
        });
    });
}

function signOutClick() {
    localStorage.setItem('email', '');
    currentUser = null;
    renderLoginPage('', null);
}

function submitBatchClick() {
    const user = currentUser;
    const sessions = currentSessions;

    const radio = document.querySelector('input[name="batch-radio"]:checked');
    if (radio === null) {
        return renderBatchSelectionPage(user, sessions, '[Error] Please select the batch 🙏');
    }
    const batch = radio.value;
    console.assert(batch === 'Morning' || batch === 'Evening');

    renderLoadingPage();
    setUserBatch(user, batch, (error) => {
        if (error) {
            renderBatchSelectionPage(user, sessions, error);
        }
        return renderSessionsPage(user, sessions, error);
    });
}

// ===== Page Rendering =====
function renderLoadingPage() {
    setRoot(`
    <div class="m-auto">
      <div class="m-10 flex max-w-96 flex-col gap-4">

        <span class="loading loading-infinity loading-lg m-auto text-accent"></span>
        <p>Waiting is not about time. Waiting is a certain quality...
        When you see the reality of who you are in the existence, only then you can wait.</p>
        <p>–Sadhguru</p>
      </div>
    </div>
    `);
}

function renderLoginPage(email, error) {
    setNavbarRight('');

    setRoot(`
      <div class="w-fit m-auto">
        <div class="card card-compact bg-neutral-content m-10 max-w-96 shadow-xl">
          <figure>
            <img
              src="${IECO_COVER_IMG}"
              alt="IEO Cover" />
          </figure>
          <div class="card-body">
            <h2 class="card-title">Inner Engeneering Online</h2>

            <label class="input input-bordered bg-neutral-content flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                class="h-4 w-4 opacity-70">
                <path
                  d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                <path
                  d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
              </svg>
              <input id="email-input" type="email" class="grow" placeholder="Email" value="${email}" />
            </label>

            <div id="email-not-found" class="text-error">${error ? error : ''}</div>
            <div class="card-actions justify-end">
              <button onclick="logInClick();" class="btn btn-accent font-bold text-white">
                  Log In
              </button>
            </div>
          </div>
        </div>
      </div>`);
}

function renderBatchSelectionPage(user, sessions, error) {
    setNavbarRight(`
      <li class="w-36 text-center m-auto">${user.name}</li>
      <li><button onclick="signOutClick();" class="btn btn-outline btn-accent btn-sm">Sign Out</button></li>`);

    setRoot(`
      <div class="m-fit m-auto max-w-96">
        <div class="m-10">
          <p class="text-xl font-bold mt-5">Languague:</p>

          <div class="mt-2">
            <label class="cursor-pointer">
              <input type="radio" name="lang-radio" class="radio radio-accent align-middle" checked="checked"/>
              <span class="align-middle m-1">${user.lang}</span>
            </label>
          </div>

          <p class="text-xl font-bold mt-5">Please select the batch time:</p>

          <div class="mt-2">
            <label class="cursor-pointer">
              <input type="radio" name="batch-radio" class="radio radio-accent align-middle" value="Morning" />
              <span class="align-middle m-1">Morning 6:00 AM</span>
            </label>
          </div>

          <div class="mt-2">
            <label class="cursor-pointer">
              <input type="radio" name="batch-radio" class="radio radio-accent align-middle" value="Evening" />
              <span class="align-middle m-1">Evening 6:00 PM</span>
            </label>
          </div>

          <button class="btn btn-accent font-bold text-white mt-5" onclick="submitBatchClick();">Submit</button>
          <p class="text-error">${error ? error : ''}</p>

          <p class="mt-5 text-left">
            <strong>Note:</strong> By selecting the batch time,
            you are committing to attend all sessions at the selected time. You won't be
            able to change the batch later.
          </p>
        </div>
      </div>`);
}

function getSessionHtml(user, session) {
    const now = toIST(new Date());
    const sessionStart = toIST(session.start);
    const isDisabled =
        now.year !== sessionStart.year ||
        now.month !== sessionStart.month ||
        now.day !== sessionStart.day;

    return `
        <div class="bg-neutral-content shadow-md text-center rounded-box my-5 p-3">
            <div class="font-semibold">${session.name} (${session.lang})</div>

            <div>
                Starts ${toISTString(session.start)} IST
            </div>

            <div>
                <a
                    ${isDisabled ? 'disabled="disabled"' : ''}
                    class="btn btn-accent font-bold text-white mt-3 btn-sm"
                    href="#">
                    Join
                </a>
            </div>
        </div>
    `;
}

function renderSessionsPage(user, sessions, error) {
    setNavbarRight(`
        <li class="w-36 text-center m-auto">${user.name}</li>
        <li><button onclick="signOutClick();" class="btn btn-outline btn-accent btn-sm">Sign Out</button></li>`);

    const userSessions = sessions.filter((s) => s.lang === user.lang && s.batch === user.batch);

    setRoot(`
        <div class="text-error">${error ? error : ''}</div>
        <div class="m-fit m-auto max-w-96 prose">
            <div class="m-10">
                <p class="text-xl font-bold">Sessions</p>
                <p><strong>Note:</strong> Buttons become active on the day of the session.</p>
                ${userSessions.map((s) => getSessionHtml(user, s)).join('')}
            </div>
        </div>
        `);
}

function renderPage() {
    const email = localStorage.getItem('email');
    if (email) {
        renderLoginPage(email, null);
    } else {
        renderLoginPage('', null);
    }
}

// ===== Code Execution =====
const BASE = location.hostname === 'localhost' ? './' : 'https://alexfreik.github.io/iza/src/';
const IECO_COVER_IMG = BASE + 'ieo-cover.jpg';

let currentUser = null;
let currentSessions = null;

renderPage();
