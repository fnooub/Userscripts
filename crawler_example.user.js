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
		var fileName = $('h1').text().trim();
		var blob = new Blob([text], {
			encoding: 'UTF-8',
			type: 'text/plain; charset=UTF-8'
		});

		$download.attr({
			href: window.URL.createObjectURL(blob),
			download: fileName + '.txt'
		}).text('Tải xong, click để tải về').off('click');

		$(window).off('beforeunload');
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
			text += chapTitle + '\n' + chapContent;

			console.log(chapTitle);

			count++;
			if (count >= urls.length) {
				saveEbook();
				return;
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

	var $download = $('<a>', {
		style: 'background-color:lightblue;',
		href: '#download',
		text: 'Tải xuống'
	});

	$download.insertAfter('.info');

	$download.one('click contextmenu', function (e) {
		e.preventDefault();

		if (pageUrl.length) {
			getListChap(pageUrl);

			$(window).on('beforeunload', function() {
				return 'Truyện đang được tải xuống...';
			});

			$download.one('click', function(e) {
				e.preventDefault();
				saveEbook();
			});
		}
	});



})(jQuery, window, document);