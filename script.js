// @ts-check
"use strict";
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
let customLogins = [];

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
  remoteUrl: "",
};

/**
 * Shows a list of active filters to be filtered
 * in the list of test accounts.
 *
 * @type {Map<string, string>}
 */
const activeFilters = new Map();

/**
 * Polyfill window browser for cross browser support.
 */
window.browser = (function () {
  return window.msBrowser || window.browser || window.chrome;
})();

/**
 * Create a new entry for a login
 * @param {Login} login
 * @returns Returns a login entry row as HTMLElement
 */
const createEntry = (login) => {
  const template = document.querySelector("#login-template");

  if (!template) {
    return null;
  }

  /** @type {HTMLElement} */
  // @ts-ignore seems to not be solvable in ts-check
  const clone = /** @type {HTMLTemplateElement} */ (template).content.cloneNode(
    true
  );

  /** @type {HTMLSpanElement | null} */
  const tUsername = clone.querySelector(".username");
  /** @type {HTMLSpanElement | null} */
  const tDescription = clone.querySelector(".description");
  /** @type {HTMLButtonElement | null} */
  const copyUsernameButton = clone.querySelector(".copy-username");
  /** @type {HTMLButtonElement | null} */
  const copyPasswordButton = clone.querySelector(".copy-password");
  /** @type {HTMLButtonElement | null} */
  const autoFillButton = clone.querySelector(".auto-fill");
  /** @type {HTMLButtonElement | null} */
  const categories = clone.querySelector(".login-categories");

  if (
    !tUsername ||
    !tDescription ||
    !copyUsernameButton ||
    !copyPasswordButton ||
    !autoFillButton ||
    !categories
  ) {
    return null;
  }

  tUsername.innerText = login.username;
  tDescription.innerText = login.description;
  tDescription.title = login.description;
  copyUsernameButton.onclick = () =>
    copyToClipboard(login.username, "Username");
  copyPasswordButton.onclick = () =>
    copyToClipboard(login.password, "Password");
  autoFillButton.onclick = () =>
    autoFillLogin({
      tab: activeTab,
      username: login.username,
      password: login.password,
    });

  if (login.categories) {
    for (const [, value] of Object.entries(login.categories)) {
      const category = document.createElement("li");
      category.innerText = value;
      categories.appendChild(category);
    }
  }

  return clone;
};

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
};

/**
 * Checks if a certain Login matches active filters.
 * @param {number} amountVisible
 * @param {number} amountTotal
 */

const updateAccountSum = (amountVisible, amountTotal) => {
  /** @type {HTMLSpanElement | null} */
  const accountSum = document.querySelector(".account-sum");
  if (!accountSum) {
    return;
  }

  accountSum.innerHTML = `<strong>${amountVisible}</strong>&nbsp;/&nbsp;${amountTotal} Accounts`;
};

/**
 * Main function to update the display.
 * Renders the list of logins.
 */
const updateDisplay = () => {
  /** @type {HTMLUListElement | null} */
  const root = document.querySelector("#login-root");

  if (!root) {
    return;
  }

  // clear inner HTML
  root.innerHTML = "";

  const allLogins = [...remoteLogins, ...customLogins];

  // render predefined logins
  const visibleLogins = allLogins
    .filter(
      (login) =>
        // check username
        (login.username &&
          login.username?.toLowerCase().includes(search.toLowerCase())) ||
        // check description
        (login.description &&
          login.description.toLowerCase().includes(search.toLowerCase())) ||
        // check if any of the category values matches the search
        (login.categories &&
          Object.values(login.categories).some((catValue) =>
            catValue.toLowerCase().includes(search.toLowerCase())
          ))
    )
    .filter(isMatchingActiveFilters);

  visibleLogins.forEach((login) => {
    const clone = createEntry(login);
    if (clone) {
      root.appendChild(clone);
    }
  });

  updateAccountSum(visibleLogins.length, allLogins.length);
  initItemToggle();
};

/**
 * Initialize the search input
 */
const initSearch = () => {
  /** @type {HTMLInputElement | null} */
  const searchInput = document.querySelector("#search");
  if (!searchInput) {
    return;
  }
  searchInput.oninput = (event) => {
    if (event.target) {
      search = /** @type {HTMLInputElement} */ (event.target).value;
      updateDisplay();
    }
  };
};

/**
 * Initialize the navigation buttons.
 */
const initNavigateButtons = () => {
  /** @type {NodeListOf<HTMLAnchorElement> | null} */
  const navLinks = document.querySelectorAll(".navlink");

  navLinks.forEach((link) => {
    link.onclick = (e) => {
      e.preventDefault();
      const linkTarget = link.getAttribute("data-target");
      navLinks.forEach((otherLink) => {
        otherLink.removeAttribute("data-active");
      });
      link.setAttribute("data-active", "true");
      window.location.hash = linkTarget || "";
    };
  });

  navLinks[0].click();
};

const initItemToggle = () => {
  /** @type {NodeListOf<HTMLButtonElement> | null} */
  const moreButtons = document.querySelectorAll(".button-more");

  if (!moreButtons) {
    throw new Error('".button-more" could not be found.');
  }

  moreButtons.forEach((button) => {
    button.addEventListener("click", () => {
      console.log("click", button);
      const item = button?.parentElement;
      const activeItem = document.querySelector(".open");

      if (activeItem !== item) {
        activeItem?.classList.remove("open");
      }
      item?.classList.toggle("open");
    });
  });
};

const navigateToLogins = () => {
  /** @type {HTMLAnchorElement | null} */
  const loginLink = document.querySelector("[data-target='logins']");

  if (loginLink) {
    loginLink.click();
  }
};

/**
 * Initialise the upload input.
 */
const initUpload = () => {
  /** @type {HTMLInputElement | null} */
  const uploadInput = document.querySelector("#upload");
  /** @type {HTMLButtonElement | null} */
  const deleteCustomLogins = document.querySelector("#delete-custom-logins");

  if (!uploadInput || !deleteCustomLogins) {
    return;
  }

  deleteCustomLogins.onclick = () => {
    // @ts-ignore-next-line
    browser.storage.sync.remove("tamLoginCreds");
    customLogins = [];
    addToastNotification("Uploaded accounts deleted!", "success");
    updateDisplay();
  };

  // Handle file upload
  uploadInput.onchange = () => {
    try {
      const reader = new FileReader();
      reader.addEventListener("load", async (event) => {
        if (!event || !event.target || !event.target.result) {
          return;
        }
        const json = JSON.parse(event.target.result.toString());
        if (json && Array.isArray(json)) {
          customLogins = [...customLogins, ...json];

          await saveCustomLogins();
          addToastNotification(
            `Successfully added ${json.length} new logins!`,
            "success"
          );

          initCategories();
          updateDisplay();
          navigateToLogins();
        }
      });
      if (uploadInput.files && uploadInput.files.length > 0) {
        reader.readAsText(uploadInput.files[0]);
      }
    } catch (e) {
      // @todo: improve error handling
      console.error("TAM: ", e);
    }
  };
};

const initAutoLogin = () => {
  /** @type {HTMLInputElement | null} */
  const autoLogin = document.querySelector("#auto-login");

  if (!autoLogin) {
    return;
  }

  autoLogin.checked = options.autoLogin;
  autoLogin.onchange = (event) => {
    if (event.target) {
      options.autoLogin = /** @type {HTMLInputElement} */ (
        event.target
      ).checked;
      saveOptions();
    }
  };
};

const initOpenNewTab = () => {
  /** @type {HTMLInputElement | null} */
  const openButton = document.querySelector("#open-options");

  if (!openButton) {
    return;
  }

  openButton.onclick = () => {
    browser.tabs.create({
      url: browser.extension.getURL("index.html#option"),
    });
  };
};

const saveOptions = async () => {
  // @ts-ignore-next-line
  await browser.storage.sync.set({
    tamLoginOptions: options,
  });
  console.log("TAM: options saved");
};

const loadOptions = async () => {
  // @ts-ignore-next-line
  const result = await browser.storage.sync.get(["tamLoginOptions"]);
  if (result.tamLoginOptions) {
    options = result.tamLoginOptions;
  }
};

const saveFilters = async () => {
  try {
    const filterValues = Object.fromEntries(activeFilters);
    // @ts-ignore-next-line
    await browser.storage.sync.set({
      tamFilters: filterValues,
    });
    console.log("TAM: Filters saved", filterValues);
  } catch (e) {
    console.error("TAM: ", e);
  }
};

const loadFilters = async () => {
  // @ts-ignore-next-line
  const result = await browser.storage.sync.get(["tamFilters"]);
  if (result.tamFilters) {
    Object.entries(result.tamFilters).forEach(([key, value]) => {
      activeFilters.set(key, value);
    });
  }
};

const saveCustomLogins = async () => {
  try {
    // @ts-ignore-next-line
    await browser.storage.sync.set({
      tamLoginCreds: customLogins,
    });
    // @todo: check
    // if (browser.runtime.lastError) {
    //     if (browser.runtime.lastError.message.startsWith("QUOTA_BYTES_PER_ITEM")
    //         || browser.runtime.lastError.message.startsWith("QUOTA_BYTES")
    //         || browser.runtime.lastError.message.startsWith("MAX_ITEMS")
    //     ) {
    //         addToastNotification("Your uploaded account-file is too big. We will only save it locally!", "error");
    //         await browser.storage.local.set({
    //             tamLoginCreds: customLogins
    //         })
    //     }
    // }
  } catch (e) {
    addToastNotification(
      "Your uploaded account-file is too big. We will only save it locally!",
      "error"
    );
    await browser.storage.local.set({
      tamLoginCreds: customLogins,
    });
  }
};

const loadCustomLogins = async () => {
  // @ts-ignore-next-line
  const resultsFromSync = await browser.storage.sync.get(["tamLoginCreds"]);
  const resultsFromLocal = await browser.storage.local.get(["tamLoginCreds"]);

  customLogins = [
    ...(resultsFromSync.tamLoginCreds ? resultsFromSync.tamLoginCreds : []),
    ...(resultsFromLocal.tamLoginCreds ? resultsFromLocal.tamLoginCreds : []),
  ];
};

const names = ["handsome", "friend", "stranger", "gorgeous"];

const registerContentScript = async () => {
  try {
    await browser.tabs.executeScript({
      file: "/content_scripts/attemptAutoFill.js",
    });
  } catch (e) {
    console.error("TAM: ", e);
  }
};

const initialiseActiveTab = async () => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  activeTab = tabs[0];
};

const init = async () => {
  try {
    await registerContentScript();
    await initialiseActiveTab();
    await loadCustomLogins();
    await initRemoteLogins();
    await loadOptions();
    await loadFilters();
  } catch (e) {
    console.error(e);
  }
};

init().then(() => {
  initUpload();
  initSearch();
  initOpenNewTab();
  initAutoLogin();
  initNavigateButtons();
  updateDisplay();
  initCategories();
  hideLoader();
  if (Math.random() < 0.1) {
    addToastNotification(
      `Hi there, ${names[Math.floor(Math.random() * names.length)]}!`,
      "success"
    );
  }
});

/**
 * Copy text to clipboard
 * @param {string} text
 * @param {string} itemText
 */
const copyToClipboard = (text, itemText) => {
  navigator.clipboard.writeText(text).then(
    function () {
      /* success */
      addToastNotification(`${itemText} copied to clipboard!`, "success");
    },
    function () {
      /* failure */
      addToastNotification(`Could not copy ${itemText} to clipboard!`, "error");
    }
  );
};

/**
 * Trigger auto fill function in DOM.
 */
const autoFillLogin = async ({ tab, username, password }) => {
  // @ts-ignore-next-line
  // browser.tabs.executeScript({
  //     target: {tabId: tab.id},
  //     func: attemptAutoFill,
  //     args: [username, password, options]
  // })
  browser.tabs.sendMessage(tab.id, {
    command: "autofill",
    username,
    password,
    useAutoLogin: options.autoLogin,
  });
};

/**
 * Get all categories for a given set of logins.
 * @returns {Categories} Returns all categories from logins
 */
const getCategories = () => {
  /** @type {Categories} */
  let categoryCollection = {};

  const allLogins = [...customLogins, ...remoteLogins];

  allLogins.forEach(({ categories }) => {
    if (!categories) return;
    Object.entries(categories).forEach(([key, value]) => {
      if (key in categoryCollection) {
        if (categoryCollection[key].includes(value)) return;

        categoryCollection[key].push(value);
        return;
      }
      categoryCollection[key] = [value];
    });
  });

  return categoryCollection;
};

/**
 * Create a category filter node.
 *
 * @param filterName {string}
 * @param values {string[]}
 */
const createCategoryFilter = (filterName, values) => {
  /** @type {HTMLTemplateElement | null} */
  const template = document.getElementById("category-filter-template");

  if (!template) {
    return null;
  }

  /** @type {HTMLElement} */
  // @ts-ignore seems to not be solvable in ts-check
  const clone = /** @type {HTMLTemplateElement} */ (template).content.cloneNode(
    true
  );

  /** @type {HTMLSelectElement | null} */
  const select = clone.querySelector("select");
  /** @type {HTMLLabelElement | null} */
  const label = clone.querySelector("label");

  if (!select || !label) {
    return null;
  }

  select.name = filterName;
  select.id = `select-${filterName}`;
  label.innerText = filterName;
  label.htmlFor = `select-${filterName}`;

  const option = document.createElement("option");
  option.value = "SELECT_NONE";
  option.text = "Select None";
  select.appendChild(option);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.text = value;
    select.appendChild(option);
  });

  select.addEventListener("change", async (event) => {
    const value =
      event.target.value === "SELECT_NONE" ? null : event.target.value;
    if (value === null) {
      activeFilters.delete(event.target.name);
      select.removeAttribute("data-value");
    } else {
      activeFilters.set(event.target.name, value);
      select.setAttribute("data-value", value);
    }
    await saveFilters();
    updateDisplay();
  });

  return clone;
};

/**
 * Mounts select elements to categories track.
 * This happens based on a key value pair of categories.
 * A select change triggers updateDisplay and filters
 * for the selected categories.
 */
const initCategories = () => {
  /** @type {HTMLUListElement | null} */
  const categoryList = document.querySelector(".categories-list");
  /** @type {HTMLButtonElement | null} */
  const resetFilter = document.querySelector("#category-reset");
  resetFilter.onclick = () => {
    for (const key of activeFilters.keys()) {
      activeFilters.delete(key);
    }
    syncActiveFiltersToSelects();
    saveFilters();
    updateDisplay();
  };

  if (!categoryList) {
    return;
  }

  const categories = getCategories();

  Object.entries(categories).forEach(([key, value]) => {
    const selectElement = createCategoryFilter(key, value);
    categoryList.appendChild(selectElement);
  });

  syncActiveFiltersToSelects();
};

const syncActiveFiltersToSelects = () => {
  /** @type {HTMLUListElement | null} */
  const categoryList = document.querySelector(".categories-list");
  /** @type {NodeListOf<HTMLSelectElement>} */
  const categorySelects = categoryList.querySelectorAll("select");

  if (!categorySelects.length) {
    return;
  }

  categorySelects.forEach((select) => {
    const { name } = /** @type {HTMLSelectElement} */ (select);
    if (activeFilters.has(name)) {
      select.value = activeFilters.get(name);
      select.setAttribute("data-value", activeFilters.get(name));
    } else {
      select.value = "";
      select.removeAttribute("data-value");
    }
  });
};

const initRemoteLogins = async () => {
  /** @type {HTMLInputElement | null} */
  const input = document.querySelector("#remote-url");
  const syncButton = document.querySelector("#sync-remote");
  const syncDeleteButton = document.querySelector("#delete-remote");

  if (input === null) throw new Error("Could not find selector '#remote-url'");
  if (syncButton === null)
    throw new Error("Could not find selector '#sync-remote'");
  if (syncDeleteButton === null)
    throw new Error("Could not find selector '#delete-sync'");

  syncDeleteButton.addEventListener("click", async () => {
    input.value = "";
    options.remoteUrl = "";
    await saveOptions();
    addToastNotification("Removed remote sync!", "success");
  });

  syncButton.addEventListener("click", async () => {
    const url = input.value;

    if (!url) {
      options.remoteUrl = "";
      await saveOptions();
      addToastNotification("Removed remote sync!", "success");
      return;
    }

    try {
      const hasPermission = await browser.permissions.request({
        origins: [url],
      });
      if (!hasPermission) {
        addToastNotification("Need permission to access url: " + url, "error");
        return;
      }
      showLoader();
      options.remoteUrl = url;
      saveOptions();
      await syncFromRemoteUrl(url);
      navigateToLogins();
      hideLoader();
      addToastNotification("Loaded accounts from remote URL!", "success");
    } catch (e) {
      console.error("TAM: ", e);
      hideLoader();
    }
  });

  try {
    if (options.remoteUrl) {
      input.value = options.remoteUrl;
      await syncFromRemoteUrl(options.remoteUrl);
    }
  } catch (e) {
    console.error(e);
    addToastNotification("Failed to initialise remote logins", "error");
  }
};

/**
 * Fetches data from remote url and sets remoteLogins.
 * @param {string} url
 */
const syncFromRemoteUrl = async (url) => {
  try {
    // Check if permission were granted (should be).
    const hasPermission = await browser.permissions.contains({
      origins: [url],
    });
    if (!hasPermission) {
      addToastNotification(
        `Need permission to access url: ${url}. You can grant them when setting the url in the options.`,
        "error"
      );
      return;
    }
    // @todo: look up cache control headers
    const response = await fetch(url, { cache: "no-cache" });
    remoteLogins = await response.json();
    updateDisplay();
  } catch (e) {
    addToastNotification("Remote sync failed!", "error");
    throw e;
  }
};

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
  const clone = /** @type {HTMLTemplateElement} */ (template).content.cloneNode(
    true
  );

  /** @type {HTMLOutputElement | null} */
  const container = clone.querySelector(".toast");
  /** @type {HTMLSpanElement | null} */
  const toastText = clone.querySelector(".toast-text");

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
    container.addEventListener("animationend", () => {
      container.remove();
    });
  };

  container.onclick = removeToast;
  setTimeout(() => {
    removeToast();
  }, 3000);

  root.appendChild(clone);
};

/**
 * Show the loader.
 */
const showLoader = () => {
  /** @type {HTMLDivElement | null} */
  const loader = document.querySelector("#loader");
  if (!loader) {
    return;
  }

  loader.removeAttribute("hidden");
};

/**
 * Hide the loader.
 */
const hideLoader = () => {
  /** @type {HTMLDivElement | null} */
  const loader = document.querySelector("#loader");
  if (!loader) {
    return;
  }

  loader.setAttribute("hidden", "");
};
