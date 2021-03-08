// ==UserScript==
// @name         Truyentv txt
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://truyentv.net/*/
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
		
		txt += LINE2 + url + LINE2;

		if (debugLevel == 2) console.log('%cError: ' + url, 'color:red;');
		if (debugLevel > 0) console.error(err);
	}

	function saveEbook() {
		if (endDownload) return;
		endDownload = true;

		var ebookTitle = $('h1').text().trim(),
			ebookAuthor = location.host,
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
		txt = ebookTitle.toUpperCase() + LINE + ebookAuthor + LINE2 + beginEnd + LINE + titleError + LINE2 + txt;

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
		chapId = chapList[count][0];
		chapTitle = chapList[count][1];

		$.get(chapId)
			.done(function (response) {

				var $data = $(response),
					$chapter = $data.find('div[style*="background:#f7f7f7"]'),
					$notContent = $chapter.find('iframe, script, style, center:has(strong)');

				if (endDownload) return;
				
				//chapTitle = $chapter.find('font[color="red"]').text().trim();

				if (!$chapter.length) {
					downloadFail('Missing content.');
				} else {
					$downloadStatus('yellow');

					txt += LINE2 + chapTitle.toUpperCase() + LINE;
					
					if ($notContent.length) $notContent.remove();
					
					$chapter = $chapter.html().replace(/\r?\n+/g, ' ');
					$chapter = $chapter.replace(/<br\s*[\/]?>/gi, '\n');
					$chapter = $chapter.replace(/<(p|div)[^>]*>/gi, '').replace(/<\/(p|div)>/gi, '\n\n');
					$chapter = $($.parseHTML($chapter));

					txt += $chapter.text().trim().replace(/\n{2,}/g, '\n\n') + '\n\n---o0o---';


					count++;

					if (debugLevel === 2) console.log('%cComplete: ' + chapId, 'color:green;');
				}

				if (count === 1) begin = chapTitle;
				end = chapTitle;

				$download.text('Đang tải chương: ' + count);
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

	var $current = $('.post-page-numbers.current');

	$download.insertAfter('h1:has(center)');

	$download.one('click contextmenu', function (e) {
		e.preventDefault();
		document.title = '[...] Vui lòng chờ trong giây lát';

		if (!$current.length) {
			alert("Truyện có 1 trang, không cần tải");
			return;
		}

		var $chapList = $('.bai-viet-box:eq(4) a');
		if ($chapList.length)
		$chapList.each(function () {
			chapList.push([$(this).attr('href'), $(this).text().trim()]);
		});

		// them first chap vao chap mang
		chapList.unshift([location.href, $current.text().trim()]);

		console.log(chapList);

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
