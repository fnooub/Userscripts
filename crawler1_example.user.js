// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://truyenfull.vn/*/
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @grant        none
// ==/UserScript==

(function($, window, document) {
	'use strict';

	function saveEbook() {
		console.log(text);
		return;
	}

	function getListChap(pageUrl) {
		$.get(pageUrl).done(function(response){
			var $data = $(response);
			var $chapList = $data.find('#list-chapter .row a');
			var $next = $data.find('a:has(span.sr-only)');
			var chapList = [];
			$chapList.each(function(){
				chapList.push($(this).attr('href'));
			});
			console.log(chapList);

			urls.push(...chapList);

			countPage++;

			if (!$next.length) {
				getContent();
				return;
			} else {
				getListChap($next.attr('href'));
			}

		});
	}

	function getContent() {
		//console.log(urls);
		$.get(urls[count]).done(function(response){
			var $data = $(response),
				chapTitle = $data.find('.chapter-title').text().trim(),
				$chapContent = $data.find('#chapter-c'),
				$notContent = $chapContent.find('iframe, script, style, div, a[href*="truyenfull"]'),
				chapContent;

			if ($notContent.length) $notContent.remove();
			chapContent = $chapContent.html();
			text += chapContent;

			count++;
			if (count >= urls.length) {
				saveEbook();
			} else {
				getContent();
			}
		});
	}
	
	var count = 0; //count cua chuong
	var countPage = 0; //count cua ds chuong
	var text = ''; //noi dung cua truyen
	var urls = []; //urls chuong truyen
	var pageUrl = location.href; //trang-1

	getListChap(pageUrl);


})(jQuery, window, document);