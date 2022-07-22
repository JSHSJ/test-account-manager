// @ts-check

/**
 * @authors Joshua Stübner & Lukas Koeller
 */

/**
 * @typedef {Record<string, string[]>} Categories 
 * @typedef {{
 *  username: string;
 *  password: string;
 *  description: string;
 *  categories: Categories;
 * }} Login
 *
 * @type {Login[]}
 */
let remoteLogins = [];
/**
 * @type {Login[]}
 */
let customLogins = []

/**
 * Search variable. Updated through the search input.
 */
let search = "";

/**
 * Active tab
 */
let activeTab;

/**
 * Options
 */
let options = {
    autoLogin: false,
    remoteUrl: ''
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

    if (!template) {
        return null;
    }

    /** @type {HTMLElement} */
    // @ts-ignore seems to not be solvable in ts-check
    const clone = /** @type {HTMLTemplateElement} */ (template).content.cloneNode(true);

    /** @type {HTMLSpanElement | null} */
    const tUsername = clone.querySelector(".username")
    /** @type {HTMLSpanElement | null} */
    const tDescription = clone.querySelector(".description")
    /** @type {HTMLButtonElement | null} */
    const copyUsernameButton = clone.querySelector(".copy-username")
    /** @type {HTMLButtonElement | null} */
    const copyPasswordButton = clone.querySelector(".copy-password")
    /** @type {HTMLButtonElement | null} */
    const autoFillButton = clone.querySelector(".auto-fill")

    if (!tUsername || !tDescription || !copyUsernameButton || !copyPasswordButton || !autoFillButton) {
        return null;
    }

    tUsername.innerText = login.username;
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
    /** @type {HTMLUListElement | null} */
    const root = document.querySelector("#login-root")

    if (!root) {
        return;
    }

    // clear inner HTML
    root.innerHTML = ""

    const allLogins = [...remoteLogins, ...customLogins];

    // render predefined logins
    allLogins
        .filter(login => login.username.includes(search) || login.description.includes(search))
        .filter(isMatchingActiveFilters)
        .forEach(login => {
            const clone = createEntry(login)
            if (clone) {
                root.appendChild(clone);
            }
        })
}

/**
 * Initialize the search input
 */
const initSearch = () => {
    /** @type {HTMLInputElement | null} */
    const searchInput = document.querySelector("#search")
    if (!searchInput) {
        return
    }
    searchInput.oninput = (event) => {
        if (event.target) {
            search = /** @type {HTMLInputElement} */(event.target).value
            updateDisplay()
        }
    }
}

/**
 * Initialize the navigation buttons.
 */
const initNavigateButtons = () => {
    /** @type {NodeListOf<HTMLAnchorElement> | null} */
    const navLinks = document.querySelectorAll(".navlink");

    navLinks.forEach(
        link => {
            link.onclick = (e) => {
                e.preventDefault();
                const linkTarget = link.getAttribute("data-target");
                navLinks.forEach(otherLink => {
                    otherLink.removeAttribute("data-active")
                });
                link.setAttribute("data-active", "true")
                window.location.hash = linkTarget || ''
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
    /** @type {HTMLInputElement | null} */
    const uploadInput = document.querySelector("#upload")
    /** @type {HTMLButtonElement | null} */
    const deleteCustomLogins = document.querySelector("#delete-custom-logins")

    if (!uploadInput || !deleteCustomLogins) {
        return;
    }

    deleteCustomLogins.onclick = () => {
        // @ts-ignore-next-line
        chrome.storage.sync.remove("pwmLoginCreds")
        customLogins = []
        updateDisplay()
    }


    // Handle file upload
    uploadInput.onchange = () => {
        try {
            const reader = new FileReader();
            reader.addEventListener('load', (event) => {
                if (!event || !event.target || !event.target.result) {
                    return;
                }
                const json = JSON.parse(event.target.result.toString())
                if (json && Array.isArray(json)) {
                    customLogins = [...customLogins, ...json];
                    // upload for persistence
                    // @ts-ignore-next-line
                    chrome.storage.sync.set({
                        pwmLoginCreds: customLogins
                    }, () => {
                        console.log('saved custom logins')
                    })
                    updateDisplay()
                }
            });
            if (uploadInput.files && uploadInput.files.length > 0) {
                reader.readAsText(uploadInput.files[0]);
            }
        } catch (e) {
            // @todo: improve error handling
            console.log(e)
        }
    }
}

const initAutoLogin = () => {
    /** @type {HTMLInputElement | null} */
    const autoLogin = document.querySelector("#auto-login")

    if (!autoLogin) {
        return;
    }

    autoLogin.checked = options.autoLogin;
    autoLogin.onchange = (event) => {
        if (event.target) {
            options.autoLogin = /** @type {HTMLInputElement} */(event.target).checked
            saveOptions()
        }
    }
}

const saveOptions = async () => {
    // @ts-ignore-next-line
    await chrome.storage.sync.set({
            pwmLoginOptions: options
        }, () => {
            console.log('saved options')
        }
        )
}

const loadOptions = async () => {
    // @ts-ignore-next-line
    const result = await chrome.storage.sync.get(['pwmLoginOptions']);
    console.log(result)
        if (result.pwmLoginOptions) {
            options = result.pwmLoginOptions
        }
}

const loadCustomLogins = async () => {
    // @ts-ignore-next-line
    const result = await chrome.storage.sync.get(['pwmLoginCreds']);
    if (result.pwmLoginCreds) {
            customLogins = result.pwmLoginCreds
    }
}

const init = async () => {
    await loadCustomLogins()
    await loadOptions()
    initRemoteLogins()
    updateDisplay()
    initUpload()
    initSearch()
    initAutoLogin()
    initNavigateButtons()
    initCategories()
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
    // @ts-ignore-next-line
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
    /** @type {HTMLInputElement | null} */
    const usernameInput = document.querySelector("[autocomplete='username']")
    /** @type {HTMLInputElement | null} */
    const passwordInput = document.querySelector("[autocomplete='current-password']")

    if (!usernameInput || !passwordInput) {
        return
    }

    const usernameInputEvent = new Event("input", {bubbles: true})
    const passwordInputEvent = new Event("input", {bubbles: true})

    usernameInput.value = username
    passwordInput.value = password

    usernameInput.dispatchEvent(usernameInputEvent)
    passwordInput.dispatchEvent(passwordInputEvent)

    if (opts.autoLogin) {
    /** @type {HTMLButtonElement | null} */
        const submitButton = document.querySelector("[type='submit']")
        if (submitButton) {
            submitButton.click()
        }
    }
}

// get active tab
// @ts-ignore-next-line
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

/**
 * Get all categories for a given set of logins.
 * @returns {Categories} Returns all categories from logins
 */
const getCategories = () => {
    /** @type {Categories} */
    let categoryCollection = {};

    const allLogins = [...customLogins, ...remoteLogins]

    allLogins.forEach(({ categories }) => {
        categoryCollection = {
            ...categoryCollection,
            ...categories,
        };
    });

    return categoryCollection;
};

/**
 * Mounts select elements to categories track.
 * This happens based on a key value pair of categories.
 * A select change triggers updateDisplay and filters
 * for the selected categories.
 */
const initCategories = () => {
    const tab = document.querySelector('.categories__track');

    const categories = getCategories();

    Object.entries(categories).forEach(([ key, value ]) => {
        const select = document.createElement('select');
        select.name = key;

        if (!tab) {
            throw new Error('Could not find \'.categories__track\' in document.');
        }

        tab.appendChild(select);
        const label = document.createElement('option');
        label.text = key;
        label.value = '';
        // label.disabled = true;
        label.selected = true;
        select.appendChild(label);

        select.addEventListener('change', (e) => {
            const { name, value } = /** @type {HTMLSelectElement} */ (e.target);
            if (!value) {
                delete activeFilters[name];
            } else {
                activeFilters[name] = value;
            }
            updateDisplay();
        });

        value.forEach((value) => {
            const option = document.createElement('option');
            option.value = value;
            option.text = value;
            select.appendChild(option);
        });
    });
}

const initRemoteLogins = () => {
    const input = document.querySelector('#remote-url');
    const syncButton = document.querySelector('#sync-remote');

    if (options.remoteUrl) {
        input.value = options.remoteUrl;
        syncFromRemoteUrl(options.remoteUrl)
    }

    syncButton.addEventListener('click', () => {
        const url = input.value;
        if (!url) {
            return;
        }

        options.remoteUrl = url;
        saveOptions();
        syncFromRemoteUrl(url)
    })

}

const syncFromRemoteUrl = async (url) => {
    try {
        const response = await fetch(url);
        const json = await response.json();
        remoteLogins = json;
        updateDisplay()
    } catch (e) {
        console.log('remote-sync failed', e);
    }
}
