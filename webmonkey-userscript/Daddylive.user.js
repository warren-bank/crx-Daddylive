// ==UserScript==
// @name         Daddylive
// @description  Improve site usability. Watch videos in external player.
// @version      2.3.7
// @include      /^https?:\/\/(?:[^\.\/]*\.)*(?:1ststream\.shop|247ovo\.lol|a1sports\.shop|apkship\.shop|arlive\.shop|beststreams\.shop|bfstv\.shop|bigsportz\.shop|bingsport\.shop|bizz-streams2u\.shop|bizzstream\.shop|buddycenter\.shop|buddycenters\.shop|buzzstream\.shop|crackstreamshd\.shop|cwcstreams\.com|cyclinsport\.shop|daddy-stream\.xyz|daddyhd\.shop|daddyislive\.online|daddylive\.mp|daddylive1\.ru|daddylive1\.shop|dailytechs\.shop|dlhd\.so|dlhd\.sx|doralive\.live|duplex-full\.shop|engstreams\.shop|f1streams\.lol|firestream4u\.shop|footballstreams\.lol|footyhunterhd\.shop|foxstream4u\.shop|freelivetvone\.xyz|freetvspor\.lol|freetvspor\.shop|fsportshd\.shop|gomstream\.info|hitsports\.shop|homosports\.shop|kingstreams\.shop|kingstreamss\.shop|klubsports\.buzz|klubsports\.fun|klubsports\.site|kofitv\.live|linesportz\.lol|liveplays\.shop|livesports2u\.shop|liveworld\.shop|miztv\.live|miztv\.shop|mudasir3u\.shop|nowagoal\.lol|one-stream\.shop|pandastreams\.shop|pandastreamz\.shop|poscitechs\.lol|poscitechs\.shop|poscitechs\.xyz|rainostream4u\.shop|rainostreams\.lol|rippleamu4\.shop|rippleamu4s\.shop|ripplestream2u\.shop|ripplestream4u\.shop|ripplestreams\.shop|ripplestreams2u\.shop|rockhd\.lol|soccer100\.shop|soccerhub\.lol|soccerstreams2\.click|socceryouknow\.shop|sooperstream4u\.shop|sports2watch\.shop|sportss\.shop|sportsslive\.shop|sportstreamslife\.shop|sportzlive\.shop|streamer4u\.shop|streamlight\.lol|stronstream\.shop|techtop3u\.shop|techttop\.shop|thebaldstreamer\.lol|thedaddy\.click|thedaddy\.to|thesport\.lol|tonnestreams\.shop|topstreamz\.shop|tripplestream\.com|tvtoss\.lol|unitedbacke\.shop|venushd\.click|viprow1\.shop|vipstreamer\.shop|vipstreamers\.shop|watchhdtv\.shop|worldsports4u\.shop|worldsportz4u\.shop|worldsstream\.shop|worldstreams\.lol|worldstreamz\.shop|www\.worldstreamz.shop|zenlic\.shop)\/.*$/
// @include      /^https?:\/\/(?:[^\.\/]*\.)*(?:cookiewebplay|daddylive|daddylivehd|dlhd|dokoplay|gocast|jewelavid|jimpenopisonline|maxsport|quest4play|radamel|sportkart|streamservicehd|thedaddy|weblivehdplay|zvision)\d*\.(?:buzz|click|com|eu|fun|icu|info|link|live|lol|me|mp|one|online|pk|ru|shop|site|so|sx|to|watch|xyz)\/.*$/
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

// ----------------------------------------------------------------------------- user options

var user_options = {
  "common": {
    "enable_debug_alerts":          false,
    "emulate_webmonkey":            false,
    "hide_iframe":                  true,
    "init_delay_ms":                1000
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

// ----------------------------------------------------------------------------- constants

var constants = {
  "dom_ids": {
    "container": "crx-daddylive-container"
  }
}

// ----------------------------------------------------------------------------- state

var state = {
  window:      null,
  document:    null,
  url:         null,
  referer_url: null
}

// ----------------------------------------------------------------------------- CSP

// add support for CSP 'Trusted Type' assignment
var add_default_trusted_type_policy = function() {
  if (typeof unsafeWindow.trustedTypes !== 'undefined') {
    try {
      var passthrough_policy = function(string) {return string}

      unsafeWindow.trustedTypes.createPolicy('default', {
          createHTML:      passthrough_policy,
          createScript:    passthrough_policy,
          createScriptURL: passthrough_policy
      })
    }
    catch(e) {}
  }
}

// ----------------------------------------------------------------------------- helpers (xhr)

var download_text = function(url, callback) {
  var xhr = new XMLHttpRequest()

  xhr.open('GET', url, true, null, null)

  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if ((xhr.status >= 200) && (xhr.status < 300)) {
        callback(null, xhr.responseText)
        return
      }
    }
    callback(new Error())
  }

  xhr.onerror = function(e) {
    callback(new Error())
  }

  xhr.send()
}

var download_json = function(url, callback) {
  download_text(url, function(error, text){
    try {
      if (error)
        callback(error)
      else
        callback(null, JSON.parse(text))
    }
    catch(e) {
      callback(e)
    }
  })
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
    "http":  "http://webcast-reloaded.frii.site/index.html"
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
  var iframe_url

  if (!state.document) {
    state.window   = unsafeWindow.window
    state.document = unsafeWindow.document
    state.url      = unsafeWindow.location.href
  }

  if (state.document.readyState === 'loading') {
    state.document.addEventListener('DOMContentLoaded', process_window)
  }
  else {
    state.referer_url = state.url

    iframe_url = get_iframe_url()
    if (iframe_url) {
      state.referer_url = iframe_url
    }

    add_default_trusted_type_policy()
    rewrite_dom()

    process_dom_video_url(function(success) {
      if (!success)
        process_dom_nested_iframe()
    })
  }
}

// ----------------------------------------------------------------------------- rewrite DOM

var rewrite_dom = function() {
  var scripts = extract_dom_scripts()
  var iframe = extract_dom_nested_iframe()
  var elements, container
  var i

  elements = [
    '.tabs > .tabby-tab:first-child > .tabby-content'
  ]
  for (i=0; i < elements.length; i++) {
    elements[i] = state.document.querySelector(elements[i])
  }

  empty_dom_node(state.document.body)
  state.document.open()
  state.document.write('<style>html > *, html > body > * {display: none !important;} html > body, html > body > div#' + constants.dom_ids.container + ' {display: block !important;}</style>')
  state.document.write('<div id="' + constants.dom_ids.container + '"><h3><a href="/24-7-channels.php">DaddyLive</a></h3></div>')
  state.document.close()

  container = state.document.getElementById(constants.dom_ids.container)

  if (scripts) {
    for (i=0; i < scripts.length; i++) {
      container.appendChild(scripts[i])
    }
  }

  if (iframe) {
    if (user_options.common.hide_iframe) {
      iframe.style.width = '0px'
      iframe.style.height = '0px'
    }

    container.appendChild(iframe)
  }

  for (i=0; i < elements.length; i++) {
    if (elements[i]) {
      container.appendChild(elements[i])
    }
  }

  // update link targets
  elements = container.querySelectorAll('a[target]')
  if (elements) {
    for (i=0; i < elements.length; i++) {
      elements[i].removeAttribute('target')
    }
  }

  // update link relationship
  elements = container.querySelectorAll('a[rel]')
  if (elements) {
    for (i=0; i < elements.length; i++) {
      elements[i].removeAttribute('rel')
    }
  }
}

var empty_dom_node = function(node) {
  if (!node || !(node instanceof Node)) return

  while (node.childNodes.length)
    node.removeChild(node.childNodes[0])
}

// ----------------------------------------------------------------------------- process DOM (video url)

var process_dom_video_url = function(callback) {
  extract_dom_video_url(function(video_url) {
    if (video_url) {
      if (user_options.common.enable_debug_alerts) {
        unsafeWindow.alert(JSON.stringify({hls_url: video_url, referer_url: state.referer_url}, null, 2))
      }

      process_hls_url(video_url, /* vtt_url= */ null, state.referer_url)
    }
    else {
      if (user_options.common.enable_debug_alerts) {
        unsafeWindow.alert('video not found in:' + "\n" + state.url)
      }
    }

    callback(!!video_url)
  })
}

var extract_dom_video_url_regexs = {
  whitespace: /[\r\n\t]+/g,
  v01: {
    video_url: /\s+source:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/
  },
  v02: {
    video_url_base64: /\s+source:\s*window\.atob\(\s*['"]([^'"]+)['"]\s*\)/
  },
  v03: {
    channel_id: /\s+channelKey\s*=\s*['"]([^'"]+)['"]/,
    video_url: {
      default_server_key: /['"](http[^'"]+)['"]\s*\+\s*channelKey\s*\+\s*['"]([^'"]+\.m3u8[^'"]*)['"]/,
      dynamic_server_key: /['"](http[^'"]+)['"]\s*\+\s*serverKey\s*\+\s*['"]([^'"]+)['"]\s*\+\s*serverKey\s*\+\s*['"]([^'"]+)['"]\s*\+\s*channelKey\s*\+\s*['"]([^'"]+\.m3u8[^'"]*)['"]/
    }
  },
  v04: {
    video_method: /[;\s]player\.load\s*\(\s*\{\s*source\s*:\s*(.+?)\s*\(\s*\)\s*,\s*mimeType\s*:\s*['"]([^'"]+)['"]\s*\}\s*\)/
  }
}

var extract_dom_video_url = function(callback) {
  var scripts, script, video_url

  scripts = extract_dom_scripts()

  var video_extractor_callbacks_remaining = scripts.length * 3
  var video_extractor_callback = function(extracted_video_url) {
    video_extractor_callbacks_remaining -= 1

    if (!video_url && extracted_video_url) {
      video_url = normalize_video_url(extracted_video_url)
      callback(video_url)
    }

    if (!video_url && !video_extractor_callbacks_remaining) {
      callback(null)
    }
  }

  for (var i=0; i < scripts.length; i++) {
    script = scripts[i]
    script = script.innerHTML
    script = script.replace(extract_dom_video_url_regexs.whitespace, ' ')

    extract_dom_video_url_01(script, video_extractor_callback)
    extract_dom_video_url_02(script, video_extractor_callback)
    extract_dom_video_url_03(script, video_extractor_callback)
    extract_dom_video_url_04(script, video_extractor_callback)
  }
}

var extract_dom_video_url_01 = function(script, callback) {
  var match, video_url

  match = extract_dom_video_url_regexs.v01.video_url.exec(script)
  if (match) {
    video_url = match[1]
  }

  callback(video_url)
}

var extract_dom_video_url_02 = function(script, callback) {
  var match, video_url

  match = extract_dom_video_url_regexs.v02.video_url_base64.exec(script)
  if (match) {
    video_url = unsafeWindow.atob(match[1]) + '#video.m3u8'
  }

  callback(video_url)
}

var extract_dom_video_url_03 = function(script, callback) {
  var match, channel_id

  match = extract_dom_video_url_regexs.v03.channel_id.exec(script)
  if (match) {
    channel_id = match[1]

    download_json(state.window.location.protocol + '//' + state.window.location.hostname + '/server_lookup.php?channel_id=' + channel_id, function(error, data) {
      var video_url

      if (error || !data || (typeof data !== 'object') || !data.server_key || (data.server_key === 'top1/cdn')) {
        match = extract_dom_video_url_regexs.v03.video_url.default_server_key.exec(script)
        if (match) {
          video_url = match[1] + channel_id + match[2]
        }
      }
      else {
        match = extract_dom_video_url_regexs.v03.video_url.dynamic_server_key.exec(script)
        if (match) {
          video_url = match[1] + data.server_key + match[2] + data.server_key + match[3] + channel_id + match[4]
        }
      }
      callback(video_url)
    })
  }
}

var extract_dom_video_url_04 = function(script, callback) {
  var match, video_method, video_mimetype, video_url

  match = extract_dom_video_url_regexs.v04.video_method.exec(script)
  if (match) {
    video_method   = match[1]
    video_mimetype = match[2]

    if (video_method && unsafeWindow[video_method] && (typeof unsafeWindow[video_method] === 'function')) {
      video_url = unsafeWindow[video_method]()
    }
  }

  callback(video_url)
}

var normalize_video_url = function(video_url) {
  if (video_url) {
    video_url = video_url.replace(/[\\]/g, '')
  }
  return video_url
}

var extract_dom_scripts = function() {
  return state.document.querySelectorAll('script:not([src])')
}

// ----------------------------------------------------------------------------- process DOM (nested iframe)

var process_dom_nested_iframe = function() {
  // only run in WebMonkey
  if ((typeof GM_loadFrame !== 'function') && !user_options.common.emulate_webmonkey) return

  var iframe, iframe_url
  iframe = extract_dom_nested_iframe()
  if (iframe) {
    iframe_url = get_iframe_url(iframe)

    try {
      // can the top window access the document belonging to the nested iframe (ie: same domain)
      state.window   = iframe.contentWindow
      state.document = iframe.contentDocument

      if (!state.document)
        throw new Error('cannot access: window.document')

      if (!extract_dom_scripts().length)
        throw new Error('cannot access: <script> elements in DOM')

      state.url = iframe.contentWindow.location.href

      if (!state.url || (state.url.indexOf('about:') === 0))
        state.url = iframe_url

      if (user_options.common.enable_debug_alerts) {
        unsafeWindow.alert('processing iframe:' + "\n" + state.url)
      }

      // success.. process the new DOM
      process_window()
    }
    catch(e) {
      if (user_options.common.enable_debug_alerts) {
        unsafeWindow.alert('Error inspecting iframe: ' + e.message)
        unsafeWindow.alert(JSON.stringify({iframe_url, parent_url: state.url}, null, 2))
      }

      // reload iframe in a new top window that can access the document
      if (typeof GM_loadFrame === 'function')
        GM_loadFrame(iframe_url, state.url, true)
      else if (user_options.common.emulate_webmonkey)
        redirect_to_url(iframe_url)

      state.window      = null
      state.document    = null
      state.url         = null
      state.referer_url = null
    }
  }
  else {
    if (user_options.common.enable_debug_alerts) {
      unsafeWindow.alert('iframe not found in:' + "\n" + state.url)
    }
  }
}

var extract_dom_nested_iframe = function() {
  return state.document.querySelector('iframe[allowfullscreen][src]')
}

var get_iframe_url = function(iframe) {
  var iframe_url

  if (!iframe)
    iframe = extract_dom_nested_iframe()

  if (iframe) {
    iframe_url = iframe.getAttribute('src')

    if (typeof GM_resolveUrl === 'function')
      iframe_url = GM_resolveUrl(iframe_url, state.url) || iframe_url
  }

  return iframe_url
}

// ----------------------------------------------------------------------------- bootstrap

var init = function() {
  if (state.did_init) return
  state.did_init = true

  if (user_options.common.emulate_webmonkey && (unsafeWindow.top !== unsafeWindow.window))
    return

  process_window()
}

if ((typeof user_options.common.init_delay_ms === 'number') && (user_options.common.init_delay_ms > 0)) {
  unsafeWindow.setTimeout(
    init,
    user_options.common.init_delay_ms
  )
}
else {
  init()
}
