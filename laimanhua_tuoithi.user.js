// ==UserScript==
// @name         laimanhua tuoithi
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://m.laimanhua.com/*/*/*.html
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @grant        none
// ==/UserScript==

(function($, window, document) {
	'use strict';

    var chapter = $('body').html().match(/"path":"(.+?)"/)[1];
    var firstLink = 'https://mhpic5.kingwar.cn' + chapter + '0001.jpg';
    console.log(firstLink);

	var $download = $('<a></a>', {
			href: firstLink,
			style: 'background-color:lightblue; padding: 5px',
			text: 'Tải xuống',
		});
	$download.insertAfter('header');

})(jQuery, window, document);