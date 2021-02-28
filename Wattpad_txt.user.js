// ==UserScript==
// @name         Wattpad txt
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.wattpad.com/story/*
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
            ebookAuthor = $('strong > .send-author-event').text().trim(),
            ebookDesc = $('.description').text().trim().replace(/\s+/g, ' '),
            $ebookType = $('.tag-items a'),
            ebookType = [],
            fileName = ebookTitle + '.txt',
            beginEnd = '',
            blob;

        if ($ebookType.length) {
            $ebookType.each(function () {
                ebookType.push($(this).text().trim());
            });
            ebookType = ebookType.join(', ');
        } else {
            ebookType = '';
        }

        if (titleError.length) {

            titleError = LINE + 'Các chương lỗi: ' + titleError.join(', ') + LINE;
            if (debugLevel > 0) console.warn('Các chương lỗi:', titleError);

        } else {
            titleError = '';
        }

        if (begin !== end) beginEnd = 'Từ [' + begin + '] đến [' + end + ']';

        // data
        txt = ebookTitle.toUpperCase() + LINE + ebookAuthor + LINE + ebookType + LINE + '---' + LINE + ebookDesc + LINE + '---' + LINE2 + beginEnd + LINE + titleError + LINE2 + txt;

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
                    $chapter = $data.find('div.panel-reading'),
                    $notContent = $chapter.find('iframe, script, style, a, span, figcaption'),
                    $next;

                if (endDownload) return;

                if ($data.find('.load-more-page').length) {
                    $next = $data.find('.load-more-page');
                } else {
                    $next = $data.find('.next-part-link');
                }
                
                if ($data.find('h1').length) {
                    chapTitle = $data.find('h1').text().trim();
                } else {
                    var chapCon = chapId.match(/\/page\/(\d+)/)[1];
                    chapTitle = $data.find('h3.part-restart-chapter').text().trim();
                    chapTitle = chapTitle + ' (' + (chapCon-1) + ')';
                }

                if (!$chapter.length) {
                    downloadFail('Missing content.');
                } else {
                    $downloadStatus('yellow');

                    if ($notContent.length) $notContent.remove();

                    $chapter = $chapter.html().replace(/\r?\n+/g, ' ');
                    $chapter = $chapter.replace(/<br\s*[\/]?>/gi, '\n');
                    $chapter = $chapter.replace(/<(p|div)[^>]*>/gi, '').replace(/<\/(p|div)>/gi, '\n\n');
                    $chapter = $($.parseHTML($chapter));

                    txt += LINE2 + chapTitle.toUpperCase() + LINE;
                    txt += $chapter.text().trim().replace(/^\s+/gm, '').replace(/  +/g, ' ').replace(/[\r\t]/g, '').replace(/\n{2,}/g, '\n\n');
                }

                if (count === 0) begin = chapTitle;
                end = chapTitle;

                count++;

                document.title = '[' + count + '] ' + pageName;

                $download.text('Đang tải chương: ' + count);

                if (debugLevel === 2) console.log('%cComplete: ' + chapId, 'color:green;');

                if (!$next.length) {
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


    $download.insertAfter('h1');

    $download.one('click contextmenu', function (e) {
        e.preventDefault();
        document.title = '[...] Vui lòng chờ trong giây lát';

        var firstChap = $('.on-story-navigate').attr('href');
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