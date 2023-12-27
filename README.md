### [Daddylive](https://github.com/warren-bank/crx-Daddylive/tree/webmonkey-userscript/es5)

[Userscript](https://github.com/warren-bank/crx-Daddylive/raw/webmonkey-userscript/es5/webmonkey-userscript/Daddylive.user.js) to run in both:
* the [WebMonkey](https://github.com/warren-bank/Android-WebMonkey) application for Android
* the [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) web browser extension for Chrome/Chromium

Its purpose is to:
* redirect embedded videos from [daddylive.watch](https://daddylive.watch/) to an external player

#### Notes:

- the embedded videos are loaded in iframes and hosted at different various domains
- when running the userscript in _Tampermonkey_
  * depending on your particular browser, the userscript may not be allowed to redirect the location in the top window
  * in this case, the domain of the URL in the top window needs to be added to a whitelist that allows this action:
    - open: `chrome://settings/content/popups`
    - next to _Allow_, click: `Add`
    - enter the domain for the site hosting the iframe:
      * `https://daddylive.watch:443`
      * `https://www.daddylivehd.one:443`

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
