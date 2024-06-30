class User {
    constructor(row, data) {
        console.assert(data.length === 13);

        this.row = row;
        this.email = data[0];
        this.name = data[1];
        this.lang = data[2];
        this.progress = data[3];
        this.time = data[4];
        this.zoomLink = data[5];
        this.attendance = data.slice(6, 13);
    }
}

// ===== Utils =====
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

// ===== Actions =====
function logInClick() {
    setLoginError('');

    const email = document.getElementById('email-input').value.trim();
    localStorage.setItem('email', email);

    google.script.run
        .withSuccessHandler((resStr) => {
            let res = {};
            try {
                ret = JSON.parse(resStr);
            } catch (e) {
                setLoginError("Internal Error: couldn't parse response: " + e.toString());
            }

            if (res.error === 'NOT_FOUND') {
                return setLoginError(`Error: there are no registrations for this email.
        Please check the spelling or use a different email 🙏`);
            } else if (res.error) {
                return setLoginError(res.error);
            }
            const user = new User(res.row, res.data);
            if (user.time === '') {
                return renderTimeSelectionPage(user);
            }
            return renderUserPage(user);
        })
        .getUserByEmail(email);
}

// ===== Page Rendering =====
function renderLoginPage() {
    setNavbarRight('');

    setRoot(`
    <div class="w-fit m-auto">
    <div class="card card-compact bg-base-100 m-10 max-w-96 shadow-xl">
      <figure>
        <img
          src="./ieo-cover.jpg"
          alt="IEO Cover" />
      </figure>
      <div class="card-body">
        <h2 class="card-title">Inner Engeneering Online</h2>

        <label class="input input-bordered flex items-center gap-2">
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
          <input type="email" class="grow" placeholder="Email" />
        </label>

        <div id="email-not-found" class="text-error"></div>
        <div class="card-actions justify-end">
          <button
            id="email-input"
            onlcick="logInClick();"
            class="btn btn-accent font-bold text-neutral-content">Log In
          </button>
        </div>
      </div>
    </div>
    </div>`
    );
}

function renderTimeSelectionPage(user) {
  setNavbarRight(`
    <li class="w-28 text-center">${user.name}</li>
    <li><button class="btn btn-outline btn-accent btn-sm">Sign Out</button></li>
    `);

  setRoot(`

  `);
}

function renderUserPage(user) {
    setNavbarRight(`
    `);
}

function renderPage() {
    const email = localStorage.getItem('email');
    if (email) {
    } else {
        renderLoginPage();
    }
}

// ===== Code Execution =====

renderPage();
