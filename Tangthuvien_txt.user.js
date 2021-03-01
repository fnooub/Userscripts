// ==UserScript==
// @name         Tangthuvien txt
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://truyen.tangthuvien.vn/doc-truyen/*
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
    var debugLevel = 0;

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
            ebookAuthor = $('.tag a.blue').text().trim(),
            ebookDesc = $('.book-intro').text().trim().replace(/\s+/g, ' '),
            $ebookType = $('.tag a.red'),
            ebookType = [],
            fileName = location.pathname.replace('/doc-truyen/', '') + '.txt',
            beginEnd = '',
            blob;

        if ($ebookType.length) {
            $ebookType.each(function() {
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

    function getContent() {
        if (endDownload) return;
        chapId = chapList[count];
        //chapTitle = chapList[count][1];

        $.get(chapId)
            .done(function (response) {

                var $data = $(response),
                    $chapter = $data.find('.box-chap'),
                    $notContent = $chapter.find('iframe, script, style');

                if (endDownload) return;
                
                chapTitle = $data.find('h2').text().trim();

                if (!$chapter.length) {
                    downloadFail('Chương lỗi.')
                } else {
                    $downloadStatus('yellow');

                    if ($notContent.length) $notContent.remove();

                    $chapter = $chapter.text();
                    $chapter = $chapter.replace(/[\r\t]/g, '');
                    $chapter = $chapter.replace(/^ +/gm, '');

                    txt += LINE2 + chapTitle.toUpperCase() + LINE;
                    txt += $chapter;
                }

                count++;

                if (debugLevel === 2) console.log('%cComplete: ' + chapId, 'color:green;');

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

    var $novelId = $('#story_id_hidden');
    if (!$novelId.length) return;

    $download.insertAfter('h1');

    $download.one('click contextmenu', function (e) {
        e.preventDefault();
        document.title = '[...] Vui lòng chờ trong giây lát';

        $.get('/story/chapters', {
            story_id: $novelId.val()
        }).done( function(data) {
            chapList = data.match(/(?:href=")[^"]+(?=")/g).map(function (val) {
                return val.slice(6).trim();
            });

            if (debugLevel === 2) console.log(chapList);

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

        }).fail( function(jqXHR, textStatus) {
            console.log(textStatus);
        });

    });


})(jQuery, window, document);