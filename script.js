const logins = [
    {
        username: "owner5@mlvv.de",
        password: "Berlin.123",
        description: "Einzel, 2 BPs, mit Geld"
    },
    {
        username: "sebastian-test@mailinator.com",
        password: "Berlin.1234567",
        description: "Einzel, viele ThemenVVs, PREMIUM"
    }
];

/**
 * Search variable. Updated through the search input.
 */
let search = "";

/**
 * Custom logins. May be updated through upaloading a json file.
 */
let customLogins = [];

/**
 * Active tab
 */
let activeTab;

/**
 * Create a new entry for a login
 */
const createEntry = (login) => {
    const template = document.querySelector("#login-template")

    const clone = template.content.cloneNode(true)

    const tUsername = clone.querySelector(".username")
    const tPassword = clone.querySelector(".password")
    const tDescription = clone.querySelector(".description")
    const copyUsernameButton = clone.querySelector(".copy-username")
    const copyPasswordButton = clone.querySelector(".copy-password")
    const autoFillButton = clone.querySelector(".auto-fill")

    tUsername.innerText = login.username;
    tPassword.innerText = login.password;
    tDescription.innerText = login.description;
    tDescription.title = login.description;
    copyUsernameButton.onclick = () => copyToClipboard(login.username)
    copyPasswordButton.onclick = () => copyToClipboard(login.username)
    autoFillButton.onclick = () => autoFillLogin({
        tab: activeTab,
        username: login.username,
        password: login.password
    })

    return clone
}

/**
 * Main function to update the display.
 * Renders the list of logins.
 */
const updateDisplay = () => {
    const root = document.querySelector("#logins")
    // clear inner HTML
    root.innerHTML = ""

    // render predefined logins
    logins
        .filter(login => login.username.includes(search) || login.description.includes(search))
        .forEach(login => {
        const clone = createEntry(login)
        root.appendChild(clone);
    })

    // render custom logins
    if (customLogins.length > 0) {
        customLogins
            .filter(login => login.username.includes(search) || login.description.includes(search))
            .forEach(login => {
            const clone = createEntry(login)
            root.appendChild(clone);
        })
    }
}

/**
 * Initialize the search input
 */
const initSearch = () => {
    const searchInput = document.querySelector("#search")
    searchInput.oninput = (event) => {
        search = event.target.value
        updateDisplay()
    }
}

/**
 * Initialise the upload input.
 *
 * To be extended: improve design, maybe drop zone?
 * Also: Sync with Chrome settings for persistence.
 * https://developer.chrome.com/docs/extensions/reference/storage/
 */
const initUpload = () => {
    const uploadInput = document.querySelector("#upload")
    uploadInput.onchange = (event) => {
        try {
            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                const json = JSON.parse(event.target.result)
                if (json && Array.isArray(json)) {
                    customLogins = json
                    updateDisplay()
                }
            });
            reader.readAsText(uploadInput.files[0]);
        } catch (e) {
            // @todo: improve error handling
            console.log(e)
        }
    }
}

// init
updateDisplay()
initUpload()
initSearch()

/**
 * Copy text to clipboard
 */
const copyToClipboard = (text) => {
    const type = "text/plain";
    const blob = new Blob([text], {type});
    const data = [new ClipboardItem({[type]: blob})];

    navigator.clipboard.write(data).then(
        function () {
            /* success */
            console.log(text, "copied to clipboard")
        },
        function () {
            /* failure */
            console.log("failed to copy to clipboard")
        }
    );
}

/**
 * Trigger auto fill function in DOM.
 */
const autoFillLogin = async ({
                                 tab,
                                 username,
                                 password
                             }) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: attemptAutoFill,
        args: [username, password]
    })
}

/**
 * Attempt to auto fill the login. Looks for autocomplete elements.
 *
 * @todo: Can be extended to allow more inputs.
 */
const attemptAutoFill = (username, password) => {
    const usernameInput = document.querySelector("[autocomplete='username']")
    const passwordInput = document.querySelector("[autocomplete='current-password']")

    const usernameInputEvent = new Event("input", {bubbles: true})
    const passwordInputEvent = new Event("input", {bubbles: true})

    usernameInput.value = username
    passwordInput.value = password

    usernameInput.dispatchEvent(usernameInputEvent)
    passwordInput.dispatchEvent(passwordInputEvent)
}

// get active tab
chrome.tabs.query({active: true}).then(tabs => {
    activeTab = tabs[0];
})


// @todo: save/import functionality
// @todo: loader while tab / sync
// @todo: make more failsafe
