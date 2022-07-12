chrome.action.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed!
  console.log('Turning ' + tab.url + ' red!');
  chrome.scripting.executeScript({
    code: 'document.body.style.backgroundColor="red"'
  });
});

let tabs = [];

chrome.tabs.query({active : true}).then(tabs => storeTabs(tabs));

const storeTabs = (tabs) => {
  console.log(tabs)
  tabs = tabs;
}


// private async autoFillLogin(tab?: chrome.tabs.Tab) {
//     if (!tab) {
//       tab = await BrowserApi.getTabFromCurrentWindowId();
//     }
//
//     if (tab == null) {
//       return;
//     }
//
//     if ((await this.authService.getAuthStatus()) < AuthenticationStatus.Unlocked) {
//       const retryMessage: LockedVaultPendingNotificationsItem = {
//         commandToRetry: {
//           msg: { command: "autofill_login" },
//           sender: { tab: tab },
//         },
//         target: "commands.background",
//       };
//       await BrowserApi.tabSendMessageData(
//         tab,
//         "addToLockedVaultPendingNotifications",
//         retryMessage
//       );
//
//       BrowserApi.tabSendMessageData(tab, "promptForLogin");
//       return;
//     }
//
//     await this.main.collectPageDetailsForContentScript(tab, "autofill_cmd");
//   }
