const logins = [
    {
        username: "owner5@mlvv.de",
        password: "Berlin.123",
        description: "Nett"
    },
    {
        username: "sebastian-test@mailinator.com",
        password: "Berlin.1234567",
        description: "Nett"
    }
];

let activeTab;

const displayLogins = () => {
    const root = document.querySelector("#logins")
    const template = document.querySelector("#login-template")

    logins.forEach(login => {
        const clone = template.content.cloneNode(true)

        const tUsername = clone.querySelector(".username")
        const tPassword = clone.querySelector(".password")
        const copyUsernameButton = clone.querySelector(".copy-username")
        const copyPasswordButton = clone.querySelector(".copy-password")
        const autoFillButton = clone.querySelector(".auto-fill")

        tUsername.innerText = login.username;
        tPassword.innerText = login.password;
        copyUsernameButton.onclick = () => copyToClipboard(login.username)
        copyPasswordButton.onclick = () => copyToClipboard(login.username)
        autoFillButton.onclick = () => autoFillLogin({
            tab: activeTab,
            username: login.username,
            password: login.password
        })

        root.appendChild(clone);
    })
}

displayLogins()

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

const attemptAutoFill = (username, password) => {
    const usernameInput = document.querySelector("[autocomplete='username']")
    const passwordInput = document.querySelector("[autocomplete='current-password']")

    console.log(usernameInput)

    usernameInput.value = username
    passwordInput.value = password
}

// get active tab
chrome.tabs.query({active : true}).then(tabs => {
    activeTab = tabs[0];
})
