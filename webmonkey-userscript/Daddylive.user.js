// ==UserScript==
// @name         Daddylive
// @description  Improve site usability. Watch videos in external player.
// @version      1.0.3
// @include      /^https?:\/\/(?:[^\.\/]*\.)*(?:daddylive\.(?:me|eu|nl)|licenses\d+\.me)\/.*$/
// @include      /^https?:\/\/(?:[^\.\/]*\.)*(?:(?:eplayer|jazzy)\.to|eplayer\.click\/premiumtv)\/daddylive\.php.*$/
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
    "timeout_ms": {
      "live_videostream":           0
    }
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

// ----------------------------------------------------------------------------- redirect to iframe

var redirect_to_iframe = function() {
  var iframe, iframe_url, iframe_origin

  iframe = unsafeWindow.document.querySelector('iframe[allowfullscreen="true"][src]')

  if (!iframe)
    return

  iframe_url    = iframe.getAttribute('src')
  iframe_url    = GM_resolveUrl(iframe_url, unsafeWindow.location.href) || iframe_url
  iframe_origin = iframe_url.replace(/^(https?:\/\/[^\/]+\/).*$/i, '$1')
  GM_loadFrame(iframe_url, iframe_origin)
}

// ----------------------------------------------------------------------------- process video within iframe

var process_live_videostream = function() {
  var regex, scripts, script, video_url

  regex = {
    whitespace: /[\r\n\t]+/g,
    video_url:  /^.*\s+source:\s*['"]([^'"]+m3u8[^'"]*)['"].*$/
  }

  scripts = unsafeWindow.document.querySelectorAll('script:not([src])')

  for (var i=0; i < scripts.length; i++) {
    script = scripts[i]
    script = script.innerHTML
    script = script.replace(regex.whitespace, ' ')

    if (regex.video_url.test(script)) {
      video_url = script.replace(regex.video_url, '$1')
      break
    }
  }

  if (!video_url)
    return

  process_hls_url(video_url)
}

// ----------------------------------------------------------------------------- bootstrap

var init = function() {
  var hostname        = unsafeWindow.location.hostname
  var is_outer_frame  = (hostname.indexOf('licenses') === -1)
  var is_inner_iframe = !is_outer_frame

  if (is_outer_frame) {
    // in WebMonkey, redirect to URL of inner iframe w/ referer
    // in TamperMonkey, the userscript will be injected directly into the iframe without any additional action required

    if (typeof GM_loadFrame === 'function') {
      redirect_to_iframe()
    }

    return
  }

  if (is_inner_iframe) {
    if (user_options.common.timeout_ms.live_videostream > 0)
      setTimeout(process_live_videostream, user_options.common.timeout_ms.live_videostream)
    else
      process_live_videostream()
    return
  }
}

init()

// -----------------------------------------------------------------------------
