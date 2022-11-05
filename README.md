### [~~Daddylive~~ Maxsport](https://github.com/warren-bank/crx-Daddylive/tree/webmonkey-userscript/es5)

[Userscript](https://github.com/warren-bank/crx-Daddylive/raw/webmonkey-userscript/es5/webmonkey-userscript/Daddylive.user.js) to run in both:
* the [WebMonkey](https://github.com/warren-bank/Android-WebMonkey) application for Android
* the [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) web browser extension for Chrome/Chromium

Its purpose is to:
* redirect embedded videos from [~~daddylive.me~~](https://daddylive.me/) [maxsport.one](https://maxsport.one/) to an external player

#### Notes:

- when running the userscript in _Tampermonkey_
  * depending on your particular browser, the Chromium extension may not be allowed to redirect the parent window
  * in this case, the URL of the parent window needs to be added to a whitelist that allows this action:
    - open: `chrome://settings/content/popups`
    - next to _Allow_, click: `Add`
    - enter the domain for the site hosting the iframe:
      * `https://maxsport.one:443`

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
