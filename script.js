const logins = [
    {
        username: "owner5@mlvv.de",
        password: "Berlin.123",
        description: "Einzel, 2 BPs, mit Geld",
        categories: {
            entrypointId: 'NEW_CUSTOMER__NEW_BP__TANGIBLE_ASSETS',
            accountType: 'childSingleAccount',
        }
    },
    {
        username: "sebastian-test@mailinator.com",
        password: "Berlin.1234567",
        description: "Einzel, viele ThemenVVs, PREMIUM",
        categories: {
            entrypointId: 'NEW_CUSTOMER__NEW_BP__VV',
            accountType: 'singleAccount',
        }
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
 * Options
 */
let options = {
    autoLogin: false,
}

/**
 * Shows a list of active filters to be filtered
 * in the list of test accounts.
 * 
 * @type {Record<string, string>}
 */
const activeFilters = {};

/**
 * Create a new entry for a login
 */
const createEntry = (login) => {
    const template = document.querySelector("#login-template");

    const clone = template.content.cloneNode(true)

    const tUsername = clone.querySelector(".username")
    // const tPassword = clone.querySelector(".password")
    const tDescription = clone.querySelector(".description")
    const copyUsernameButton = clone.querySelector(".copy-username")
    const copyPasswordButton = clone.querySelector(".copy-password")
    const autoFillButton = clone.querySelector(".auto-fill")

    tUsername.innerText = login.username;
    // tPassword.innerText = login.password;
    tDescription.innerText = login.description;
    tDescription.title = login.description;
    copyUsernameButton.onclick = () => copyToClipboard(login.username)
    copyPasswordButton.onclick = () => copyToClipboard(login.password)
    autoFillButton.onclick = () => autoFillLogin({
        tab: activeTab,
        username: login.username,
        password: login.password
    })

    return clone
}

const isMatchingActiveFilters = (login) => {
    /**
     * Lists if each filters key value pair is included in login categories.
     * @type {boolean[]}
     */
    const matches = [];
    Object.entries(activeFilters).forEach(([key, value]) => {
        matches.push(login.categories?.[key] === value)
    });
    const isMatch = !matches.includes(false);
    console.log(isMatch, matches);
    return isMatch;
}

/**
 * Main function to update the display.
 * Renders the list of logins.
 */
const updateDisplay = () => {
    const root = document.querySelector("#login-root")
    // clear inner HTML
    root.innerHTML = ""

    // render predefined logins
    logins
        .filter(login => login.username.includes(search) || login.description.includes(search))
        .filter(isMatchingActiveFilters)
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
 * Initialize the navigation buttons.
 */
const initNavigateButtons = () => {
    const navLinks = document.querySelectorAll(".navlink");

    navLinks.forEach(
        link => {
            link.onclick = () => {
                const linkTarget = link.getAttribute("data-target");
                navLinks.forEach(otherLink => {
                    otherLink.removeAttribute("data-active")
                });
                link.setAttribute("data-active", "true")
                window.location.hash = linkTarget
            }
        }
    )

    navLinks[0].click()
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
    const deleteCustomLogins = document.querySelector("#delete-custom-logins")
    deleteCustomLogins.onclick = () => {
        chrome.storage.sync.remove("qLoginCreds")
        customLogins = []
        updateDisplay()
    }


    // Handle file upload
    uploadInput.onchange = () => {
        try {
            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                const json = JSON.parse(event.target.result)
                if (json && Array.isArray(json)) {
                    customLogins = [...customLogins, ...json];
                    // upload for persistence
                    chrome.storage.sync.set({
                        qLoginCreds: customLogins
                    }, () => {
                        console.log('saved custom logins')
                    })
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

const initAutoLogin = () => {
    const autoLogin = document.querySelector("#auto-login")
    autoLogin.checked = options.autoLogin;
    autoLogin.onchange = (event) => {
        options.autoLogin = event.target.checked
        saveOptions()
    }
}

const saveOptions = async () => {
    await chrome.storage.sync.set({
            qLoginOptions: options
        }, () => {
            console.log('saved options')
        }
        )
}

const loadOptions = async () => {
    const result = await chrome.storage.sync.get(['qLoginOptions']);
    console.log(result)
        if (result.qLoginOptions) {
            options = result.qLoginOptions
        }
}

const loadCustomLogins = async () => {
    const result = await chrome.storage.sync.get(['qLoginCreds']);
    if (result.qLoginCreds) {
            customLogins = result.qLoginCreds
    }
}

const init = async () => {
    await loadCustomLogins()
    await loadOptions()
    updateDisplay()
    initUpload()
    initSearch()
    initAutoLogin()
    initNavigateButtons()
}

init()

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
        args: [username, password, options]
    })
}

/**
 * Attempt to auto fill the login. Looks for autocomplete elements.
 *
 * @todo: Can be extended to allow more inputs.
 */
const attemptAutoFill = (username, password, opts) => {
    const usernameInput = document.querySelector("[autocomplete='username']")
    const passwordInput = document.querySelector("[autocomplete='current-password']")

    const usernameInputEvent = new Event("input", {bubbles: true})
    const passwordInputEvent = new Event("input", {bubbles: true})

    usernameInput.value = username
    passwordInput.value = password

    usernameInput.dispatchEvent(usernameInputEvent)
    passwordInput.dispatchEvent(passwordInputEvent)

    if (opts.autoLogin) {
        const submitButton = document.querySelector("[type='submit']")
        submitButton.click()
    }
}

// get active tab
chrome.tabs.query({active: true}).then(tabs => {
    activeTab = tabs[0];
})

/**
 * Ideas:
 *
 * Sync logins with json in S3
 * Filters for different settings
 * Delete single custom login
 */
// @todo: loader while tab / sync
// @todo: make more failsafe

const categories = {
    accountType: [
        'singleAccount',
        'jointAccount',
        'childSingleAccount',
        'childJointAccount',
    ],
    entrypointId: [
        'NEW_CUSTOMER__NEW_BP__VV',
        'NEW_CUSTOMER__NEW_BP__TOPICS',
        'NEW_CUSTOMER__NEW_BP__TANGIBLE_ASSETS',
        'EXISTING_CUSTOMER__NEW_IPS__VV',
        'EXISTING_CUSTOMER__NEW_BP__VV',
        'EXISTING_CUSTOMER__NEW_IPS__TOPICS',
        'EXISTING_CUSTOMER__UPDATE_BP',
    ],
};

const CategoriesTab = () => {
    
}
