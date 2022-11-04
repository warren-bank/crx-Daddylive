// ==UserScript==
// @name         Maxsport
// @description  Improve site usability. Watch videos in external player.
// @version      2.0.0
// @include      /^https?:\/\/(?:[^\.\/]*\.)*(?:maxsport\.one|sportkart\d+\.xyz|streamservicehd\.click)\/.*$/
// @icon         https://i.imgur.com/8EL6mr3.png
// @run-at       document-end
// @grant        unsafeWindow
// @homepage     https://github.com/warren-bank/crx-Daddylive/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-Daddylive/issues
// @downloadURL  https://github.com/warren-bank/crx-Daddylive/raw/webmonkey-userscript/es5/webmonkey-userscript/Daddylive.user.js
// @updateURL    https://github.com/warren-bank/crx-Daddylive/raw/webmonkey-userscript/es5/webmonkey-userscript/Daddylive.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

var user_options = {
  "common": {
    "emulate_webmonkey":            false,
    "init_delay_ms":                0
  },
  "webmonkey": {
    "post_intent_redirect_to_url":  "about:blank"
  },
  "greasemonkey": {
    "redirect_to_webcast_reloaded": true,
    "force_http":                   true,
    "force_https":                  false
  }
}

// ----------------------------------------------------------------------------- state

var state = {
  document:    null,
  referer_url: null
}

// ----------------------------------------------------------------------------- URL links to tools on Webcast Reloaded website

var get_webcast_reloaded_url = function(video_url, vtt_url, referer_url, force_http, force_https) {
  force_http  = (typeof force_http  === 'boolean') ? force_http  : user_options.greasemonkey.force_http
  force_https = (typeof force_https === 'boolean') ? force_https : user_options.greasemonkey.force_https

  var encoded_video_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_video_url     = encodeURIComponent(encodeURIComponent(btoa(video_url)))
  encoded_vtt_url       = vtt_url ? encodeURIComponent(encodeURIComponent(btoa(vtt_url))) : null
  referer_url           = referer_url ? referer_url : unsafeWindow.location.href
  encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))

  webcast_reloaded_base = {
    "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
    "http":  "http://webcast-reloaded.surge.sh/index.html"
  }

  webcast_reloaded_base = (force_http)
                            ? webcast_reloaded_base.http
                            : (force_https)
                               ? webcast_reloaded_base.https
                               : (video_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_video_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
  return webcast_reloaded_url
}

// ----------------------------------------------------------------------------- URL redirect

var redirect_to_url = function(url) {
  if (!url) return

  if (typeof GM_loadUrl === 'function') {
    if (typeof GM_resolveUrl === 'function')
      url = GM_resolveUrl(url, unsafeWindow.location.href) || url

    GM_loadUrl(url, 'Referer', unsafeWindow.location.href)
  }
  else {
    try {
      unsafeWindow.top.location = url
    }
    catch(e) {
      unsafeWindow.window.location = url
    }
  }
}

var process_webmonkey_post_intent_redirect_to_url = function() {
  var url = null

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'string')
    url = user_options.webmonkey.post_intent_redirect_to_url

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'function')
    url = user_options.webmonkey.post_intent_redirect_to_url()

  if (typeof url === 'string')
    redirect_to_url(url)
}

var process_video_url = function(video_url, video_type, vtt_url, referer_url) {
  if (!referer_url)
    referer_url = unsafeWindow.location.href

  if (typeof GM_startIntent === 'function') {
    // running in Android-WebMonkey: open Intent chooser

    var args = [
      /* action = */ 'android.intent.action.VIEW',
      /* data   = */ video_url,
      /* type   = */ video_type
    ]

    // extras:
    if (vtt_url) {
      args.push('textUrl')
      args.push(vtt_url)
    }
    if (referer_url) {
      args.push('referUrl')
      args.push(referer_url)
    }

    GM_startIntent.apply(this, args)
    process_webmonkey_post_intent_redirect_to_url()
    return true
  }
  else if (user_options.greasemonkey.redirect_to_webcast_reloaded) {
    // running in standard web browser: redirect URL to top-level tool on Webcast Reloaded website

    redirect_to_url(get_webcast_reloaded_url(video_url, vtt_url, referer_url))
    return true
  }
  else {
    return false
  }
}

var process_hls_url = function(hls_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ hls_url, /* video_type= */ 'application/x-mpegurl', vtt_url, referer_url)
}

var process_dash_url = function(dash_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ dash_url, /* video_type= */ 'application/dash+xml', vtt_url, referer_url)
}

// ----------------------------------------------------------------------------- process window

var process_window = function() {
  if (!state.document) {
    state.document    = unsafeWindow.document
    state.referer_url = unsafeWindow.location.href
  }

  process_dom_video_url() || process_dom_nested_iframe()
}

// ----------------------------------------------------------------------------- process DOM (video url)

var process_dom_video_url = function() {
  var video_url = extract_dom_video_url()

  if (video_url)
    process_hls_url(video_url, /* vtt_url= */ null, state.referer_url)

  return !!video_url
}

var extract_dom_video_url = function() {
  var regex, scripts, script, video_url

  regex = {
    whitespace: /[\r\n\t]+/g,
    video_url:  /^.*\s+source:\s*['"]([^'"]+m3u8[^'"]*)['"].*$/
  }

  scripts = state.document.querySelectorAll('script:not([src])')

  for (var i=0; i < scripts.length; i++) {
    script = scripts[i]
    script = script.innerHTML
    script = script.replace(regex.whitespace, ' ')

    if (regex.video_url.test(script)) {
      video_url = script.replace(regex.video_url, '$1')
      break
    }
  }

  return video_url
}

// ----------------------------------------------------------------------------- process DOM (nested iframe)

var process_dom_nested_iframe = function() {
  // only run in WebMonkey
  if ((typeof GM_loadFrame !== 'function') && !user_options.common.emulate_webmonkey) return

  var iframe, iframe_url, iframe_origin
  iframe = extract_dom_nested_iframe()
  if (iframe) {
    try {
      // can the top window access the document belonging to the nested iframe (ie: same domain)
      state.document    = iframe.contentWindow.document
      state.referer_url = iframe.contentWindow.location.href

      // success.. process the new DOM
      process_window()
    }
    catch(e) {
      // reload iframe in a new top window that can access the document
      iframe_url    = iframe.getAttribute('src')
      iframe_url    = GM_resolveUrl(iframe_url, state.referer_url) || iframe_url
      iframe_origin = iframe_url.replace(/^(https?:\/\/[^\/]+\/).*$/i, '$1')

      state.document    = null
      state.referer_url = null

      GM_loadFrame(iframe_url, iframe_origin)
    }
  }
}

var extract_dom_nested_iframe = function() {
  return state.document.querySelector('iframe[allowfullscreen][src]')
}

// ----------------------------------------------------------------------------- bootstrap

var init = function() {
  if (user_options.common.emulate_webmonkey && (window.top !== window))
    return

  if (!state.document)
    process_window()
}

setTimeout(
  init,
  user_options.common.init_delay_ms
)
