// @ts-check

/**
 * Polyfill window browser for cross browser support.
 */
window.browser = (function () {
    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();


(function () {
    /**
     * Check global execution, so we only register this once.
     */
    if (window.hasRegistered) {
        return
    }


    console.log('TAM: Initialising...')
    /**
     *
     * @param {Login["username"]} username
     * @param {Login["password"]} password
     * @param {boolean} autoLogin
     */
    const attemptAutoFill = (username, password, autoLogin) => {
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

        if (autoLogin) {
            /** @type {HTMLButtonElement | null} */
            const submitButton = document.querySelector("[type='submit']")
            if (submitButton) {
                submitButton.click()
            }
        }
    }

    browser.runtime.onMessage.addListener((message) => {
        if (message.command === "autofill") {
            attemptAutoFill(message.username, message.password, message.useAutoLogin)
        }
    })

    window.hasRegistered = true;
})()
