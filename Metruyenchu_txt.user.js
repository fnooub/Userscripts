// ==UserScript==
// @name         Metruyenchu txt
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://metruyenchu.com/truyen/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js
// @noframes
// @connect      self
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function($, window, document, undefined) {
	'use strict';

	/**
	 * Enable logging in Console
	 * @type {Number} 0 : Disable
	 *                1 : Error
	 *                2 : Info + Error
	 */
	var debugLevel = 2;

	function cleanHtml(str) {
		str = str.replace(/\s*Chương\s*\d+\s?:[^<\n]/, '');
		str = str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
		str = str.replace(/\.(?:\s*\.)+/g, '...');
		str = str.replace(/\!(?:\s*\!)+/g, '!!!');
		str = str.replace(/ +(\.|\?|!|,)/g, '$1');
		str = str.replace(/(\d)\. +(\d)/g, '$1.$2');
		return str;
	}

	function cleanTitle(str) {
		return str.replace(/ \(.+/, '');
	}

	function downloadFail(err) {
		$downloadStatus('red');
		titleError.push(chapTitle);
		
		txt += LINE2 + url + LINE2;

		if (debugLevel == 2) console.log('%cError: ' + url, 'color:red;');
		if (debugLevel > 0) console.error(err);
	}

	function saveEbook() {
		if (endDownload) return;
		endDownload = true;

		var ebookTitle = $('h1').text().trim(),
			fileName = ebookTitle + '.txt',
			beginEnd = '',
			blob;

		if (titleError.length) {

			titleError = LINE + 'Các chương lỗi: ' + titleError.join(', ') + LINE;
			if (debugLevel > 0) console.warn('Các chương lỗi:', titleError);

		} else {
			titleError = '';
		}

		if (begin !== end) beginEnd = 'Từ [' + begin + '] đến [' + end + ']';

		// data
		txt = ebookTitle.toUpperCase() + LINE + beginEnd + LINE + titleError + LINE2 + txt;

		blob = new Blob([txt], {
			encoding: 'UTF-8',
			type: 'text/plain; charset=UTF-8'
		});

		$download.attr({
			href: window.URL.createObjectURL(blob),
			download: fileName
		}).text('Tải xong').off('click');
		$downloadStatus('greenyellow');

		$win.off('beforeunload');

		document.title = '[⇓] ' + ebookTitle;
		if (debugLevel === 2) console.log('%cDownload Finished!', 'color:blue;');
		if (debugLevel > 0) console.timeEnd('TXT Downloader');
	}

	function getContent() {
		if (endDownload) return;
		chapId = chapList[count];

		$.get(chapId)
			.done(function (response) {

				var $data = $(response),
					$chapter = $data.find('#js-read__content'),
					$notContent = $chapter.find('iframe, script, style, div');

				if (endDownload) return;
				
				chapTitle = $data.find('.nh-read__title').text().trim();

				if (!$chapter.length) {
					downloadFail('Missing content.');
				} else {
					$downloadStatus('yellow');

					txt += LINE2 + cleanTitle(chapTitle).toUpperCase() + LINE;
					
					if ($notContent.length) $notContent.remove();

					$chapter = $chapter.html().replace(/\r?\n+/g, ' ');
					$chapter = $chapter.replace(/<br\s*[\/]?>/gi, '\n');
					$chapter = $chapter.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '\n\n');
					$chapter = $chapter.replace(/^.*(https?:\/\/[^\s]+).*$/gm, '');

					txt += cleanHtml($chapter).trim().replace(/\n{2,}/g, '\n\n') + '\n\n---o0o---';

					count++;

					if (debugLevel === 2) console.log('%cComplete: ' + chapId, 'color:green;');
				}

				if (count === 1) begin = chapTitle;
				end = chapTitle;

				$download.text('Đang tải chương: ' + count + '/' + chapListSize);
				document.title = '[' + count + '] ' + pageName;

				if (count >= chapListSize) {
					saveEbook();
				} else {
					getContent();
				}

		})
		.fail(function (err) {
			chapTitle = null;
			downloadFail(err);
			saveEbook();
		});
	}

	// INDEX
	var pageName = document.title,
		$win = $(window),

		$download = $('<a>', {
			style: 'background-color:lightblue;',
			href: '#download',
			text: 'Tải xuống'
		}),
		$downloadStatus = function(status) {
			$download.css("background-color", "").css("background-color", status);
		},
		endDownload = false,

		LINE = '\n\n',
		LINE2 = '\n\n\n\n',

		txt = '',
		url = '',
		count = 0,
		begin = '',
		end = '',

		chapId = '',
		chapTitle = '',
		chapList = [],
		chapListSize = 0,
		titleError = [];

	var chapCount = $('.font-weight-semibold.mb-1:first').text().trim();
	for (var i = 1; i <= chapCount; i++) {
		chapList.push(location.href + '/chuong-' + i);
	}

	if (!chapList.length) return;
	if (debugLevel == 2) console.log(chapList);

	$download.insertAfter('h1');

	$download.one('click contextmenu', function (e) {
		e.preventDefault();
		document.title = '[...] Vui lòng chờ trong giây lát';

		if (e.type === 'contextmenu') {
			$download.off('click');
			var startFrom = prompt('Nhập ID chương truyện bắt đầu tải:', chapList[0]);
			startFrom = chapList.indexOf(startFrom);
			if (startFrom !== -1) chapList = chapList.slice(startFrom);
		} else {
			$download.off('contextmenu');
		}

		chapListSize = chapList.length;
		if (chapListSize > 0) {
			getContent();

			$win.on('beforeunload', function() {
				return 'Truyện đang được tải xuống...';
			});

			$download.one('click', function(e) {
				e.preventDefault();
				saveEbook();
			});
		}

	});


})(jQuery, window, document);
