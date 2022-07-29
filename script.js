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
 *  categories: Record<string, string>;
 * }} Login
 *
 */


/**
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
 *
 * @typedef {{
 *  autoLogin: boolean;
 *  remoteUrl: string;
 * }} Options
 * @type {Options}
 */
let options = {
    autoLogin: false,
    remoteUrl: ''
}

/**
 * Shows a list of active filters to be filtered
 * in the list of test accounts.
 *
 * @type {Map<string, string>}
 */
const activeFilters = new Map();

/**
 * Create a new entry for a login
 * @param {Login} login
 * @returns Returns an login entry row as HTMLElement
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
    copyUsernameButton.onclick = () => copyToClipboard(login.username, 'Username')
    copyPasswordButton.onclick = () => copyToClipboard(login.password, 'Password')
    autoFillButton.onclick = () => autoFillLogin({
        tab: activeTab,
        username: login.username,
        password: login.password
    })

    return clone
}

/**
 * Checks if a certain Login matches active filters.
 * @param {Login} login
 * @returns {boolean} Returns true if Login is matching active filters.
 */
const isMatchingActiveFilters = (login) => {
    /**
     * Lists if each filters key value pair is included in login categories.
     * @type {boolean[]}
     */
    const matches = [];
    for (const [key, value] of activeFilters) {
        matches.push(login.categories?.[key] === value);
    }
    return !matches.includes(false);
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
        .filter(login =>
            // check username
            login.username.toLowerCase().includes(search.toLowerCase())
            // check description
            || login.description.toLowerCase().includes(search.toLowerCase())
            // check if any of the category values matches the search
            || (login.categories
                && Object.values(login.categories)
                    .some(catValue =>
                        catValue.toLowerCase().includes(search.toLowerCase())))
        ).filter(isMatchingActiveFilters)
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

const navigateToLogins = () => {
    /** @type {HTMLAnchorElement | null} */
    const loginLink = document.querySelector("[data-target='logins']");

    if (loginLink) {
        loginLink.click()
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
        addToastNotification("Uploaded accounts deleted!", "success")
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
                    navigateToLogins()
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

const names = ['handsome', 'friend', 'stranger', 'gorgeous']

const init = async () => {
    await loadCustomLogins()
    await loadOptions()
    await initRemoteLogins()
    updateDisplay()
    initUpload()
    initSearch()
    initAutoLogin()
    initNavigateButtons()
    initCategories()
    if (Math.random() < 0.1) {
        addToastNotification(`Hi there, ${names[Math.floor(Math.random() * names.length)]}!`, "success")
    }
}

init();

/**
 * Copy text to clipboard
 * @param {string} text
 * @param {string} itemText
 */
const copyToClipboard = (text, itemText) => {
    const type = "text/plain";
    const blob = new Blob([text], {type});
    const data = [new ClipboardItem({[type]: blob})];

    navigator.clipboard.write(data).then(
        function () {
            /* success */
            addToastNotification(`${itemText} copied to clipboard!`, "success")
        },
        function () {
            /* failure */
            addToastNotification(`Could not copy ${itemText} to clipboard!`, "error")
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
 *
 * @param {Login["username"]} username
 * @param {Login["password"]} password
 * @param {Options} opts
 * @returns {undefined}
 */
const attemptAutoFill = (username, password, opts) => {
    /** @type {HTMLInputElement | null} */
    const usernameInput = document.querySelector("[autocomplete='username']")
    /** @type {HTMLInputElement | null} */
    const passwordInput = document.querySelector("[autocomplete='current-password']")

    /**
     * Fill out the given field with the given value.
     * @param input {HTMLInputElement}
     * @param value {string}
     */
    const fillOutField = (input, value) => {
        const inputEvent = new Event("input", {bubbles: true})
        input.value = value
        input.dispatchEvent(inputEvent)
    }

    if (usernameInput) {
        fillOutField(usernameInput, username)
    }

    if (passwordInput) {
        fillOutField(passwordInput, password)
    }

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
chrome.tabs
    .query({active: true, currentWindow: true})
    .then(tabs => {
        activeTab = tabs[0];
    });

/**
 * Get all categories for a given set of logins.
 * @returns {Categories} Returns all categories from logins
 */
const getCategories = () => {
    /** @type {Categories} */
    let categoryCollection = {};

    const allLogins = [...customLogins, ...remoteLogins];

    allLogins.forEach(({categories}) => {
        Object.entries(categories).forEach(([key, value]) => {
            if (key in categoryCollection && !categoryCollection[key].includes(value)) {
                categoryCollection[key].push(value);
                return;
            }
            categoryCollection[key] = [value];
        });
    });

    return categoryCollection
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

    Object.entries(categories).forEach(([key, value]) => {
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
            const {name, value} = /** @type {HTMLSelectElement} */ (e.target);
            if (!value) activeFilters.delete(name)
            else activeFilters.set(name, value);

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

const initRemoteLogins = async () => {
    /** @type {HTMLInputElement | null} */
    const input = document.querySelector('#remote-url');
    const syncButton = document.querySelector('#sync-remote');

    if (input === null) throw new Error('Could not find selector \'#remote-url\'');
    if (syncButton === null) throw new Error('Could not find selector \'#sync-remote\'');

    if (options.remoteUrl) {
        input.value = options.remoteUrl;
        await syncFromRemoteUrl(options.remoteUrl)
    }

    syncButton.addEventListener('click', async () => {
        const url = input.value;
        if (!url) {
            return;
        }

        options.remoteUrl = url;
        saveOptions();
        await syncFromRemoteUrl(url);
        addToastNotification("Loaded accounts from remote URL!", "success");
        navigateToLogins()
    })

}

/**
 * Fetches data from remote url and sets remoteLogins.
 * @param {string} url
 */
const syncFromRemoteUrl = async (url) => {
    try {
        const response = await fetch(url);
        remoteLogins = await response.json();
        updateDisplay();
    } catch (e) {
        addToastNotification("Remote sync failed!", "error")
    }
}

/**
 * Shows a toast notification.
 * @param {string} message
 * @param {"success" | "error"} type
 */
const addToastNotification = (message, type) => {
    /** @type {HTMLTemplateElement | null} */
    const template = document.querySelector("#toast-template");
    /** @type {HTMLDivElement | null} */
    const root = document.querySelector("#toast-root");

    if (!template || !root) {
        return null;
    }

    /** @type {HTMLElement} */
        // @ts-ignore seems to not be solvable in ts-check
    const clone = /** @type {HTMLTemplateElement} */ (template).content.cloneNode(true);

    /** @type {HTMLOutputElement | null} */
    const container = clone.querySelector(".toast")
    /** @type {HTMLSpanElement | null} */
    const toastText = clone.querySelector(".toast-text")

    // remove unused icon from DOM
    if (type === "success") {
        /** @type {SVGElement | null} */
        const errorIcon = clone.querySelector(".toast-icon--error");
        if (errorIcon) {
            errorIcon.remove();
        }
    } else {
        /** @type {SVGElement | null} */
        const successIcon = clone.querySelector(".toast-icon--success");
        if (successIcon) {
            successIcon.remove();
        }
    }

    if (!container || !toastText) {
        return null;
    }

    toastText.innerText = message;

    const removeToast = () => {
        container.classList.add("--animate-out");
        container.addEventListener('animationend', () => {
            container.remove();
        })
    }

    container.onclick = removeToast;
    setTimeout(() => {
        removeToast();
    }, 3000);

    root.appendChild(clone);
}
