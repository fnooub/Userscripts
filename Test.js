// ==UserScript==
// @name         Test txt
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      http://*
// @include      https://*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @noframes
// @connect      self
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function($, window, document, undefined) {
    'use strict';

        var chapList = [];
        var $chapList = $('.bai-viet-box:eq(4) a');
        if ($chapList.length)
        $chapList.each(function () {
            chapList.push($(this).attr('href'));
        });

        console.log(chapList);


})(jQuery, window, document);