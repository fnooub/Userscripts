// ==UserScript==
// @name         sinodan.cc txt
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://m.sinodan.cc/view/*.html
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

	function downloadFail(err) {
		$downloadStatus('red');
		titleError.push(chapTitle);
		
		txt += LINE + url + LINE;

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
		txt = ebookTitle.toUpperCase() + LINE2 + beginEnd + LINE + titleError + LINE2 + txt;

		blob = new Blob([txt], {
			encoding: 'UTF-8',
			type: 'text/plain; charset=UTF-8'
		});

		$download.attr({
			href: window.URL.createObjectURL(blob),
			download: fileName
		}).text('Tải xong, click để tải về').off('click');
		$downloadStatus('greenyellow');

		$win.off('beforeunload');

		document.title = '[⇓] ' + ebookTitle;
		if (debugLevel === 2) console.log('%cDownload Finished!', 'color:blue;');
		if (debugLevel > 0) console.timeEnd('TXT Downloader');
	}

	function getContent(pageId) {
		if (endDownload) return;
		chapId = pageId;

		$.get(chapId)
			.done(function (response) {

				var $data = $(response),
					$chapter = $data.find('.page-content.font-large'),
					$notContent = $chapter.find('iframe, script, style'),
					$next,
					nextUrl;

				if (endDownload) return;

				$next = $data.find('span.curr').next('a');
				if (!$next.length) {
					$next = $data.find('a.next');
				}

				chapTitle = $data.find('h1').text().trim();

				if (!$chapter.length) {
					downloadFail('Missing content.');
				} else {
					$downloadStatus('yellow');

					if ($notContent.length) $notContent.remove();

					txt += chapTitle + LINE;
					txt += $chapter.text().replace(/&nbsp;/gi, '') + LINE2;
				}

				if (count === 0) begin = chapTitle;
				end = chapTitle;

				count++;

				document.title = '[' + count + '] ' + pageName;

				$download.text('Đang tải chương: ' + count);

				if (debugLevel === 2) console.log('%cComplete: ' + chapId, 'color:green;');

				nextUrl = $next.attr('href');
				if (!nextUrl.length || nextUrl == '#') {
					saveEbook();
				} else {
					getContent($next.attr('href'));
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


	$download.insertBefore('h1');

	$download.one('click contextmenu', function (e) {
		e.preventDefault();
		document.title = '[...] Vui lòng chờ trong giây lát';

		var firstChap = location.href;
		console.log(firstChap);
		var startFrom = firstChap;

		if (e.type === 'contextmenu') {
			$download.off('click');
			startFrom = prompt('Nhập ID chương truyện bắt đầu tải:', firstChap) || firstChap;
		} else {
			$download.off('contextmenu');
		}

		if (startFrom.length) {
			getContent(startFrom);

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