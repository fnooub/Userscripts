// ==UserScript==
// @name            Bachngocsach downloader
// @name:vi         Bachngocsach downloader
// @namespace       http://devs.forumvi.com/
// @description     Tải truyện từ Bachngocsach định dạng EPUB.
// @description:vi  Tải truyện từ Bachngocsach định dạng EPUB.
// @version         4.8.6
// @icon            https://i.imgur.com/px1ASIY.png
// @author          Zzbaivong
// @oujs:author     baivong
// @license         MIT; https://baivong.mit-license.org/license.txt
// @match           https://bachngocsach.com/reader/*
// @require         https://code.jquery.com/jquery-3.5.1.min.js
// @require         https://unpkg.com/jszip@3.1.5/dist/jszip.min.js
// @require         https://unpkg.com/file-saver@2.0.2/dist/FileSaver.min.js
// @require         https://unpkg.com/ejs@2.7.4/ejs.min.js
// @require         https://unpkg.com/jsepub/dist/jepub.min.js
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?v=a834d46
// @noframes
// @connect         self
// @supportURL      https://github.com/lelinhtinh/Userscript/issues
// @run-at          document-end
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// ==/UserScript==

(function ($, window, document) {
  'use strict';

  /**
   * Nhận cảnh báo khi có chương bị lỗi
   *
   * @type {Boolean}
   */
  var errorAlert = true;

  /**
   * Những đoạn ghi chú nguồn truyện
   * Toàn bộ nội dung ghi chú, có phân biệt hoa thường
   *
   * @type {Array}
   */
  var citeSources = [
    'Text được lấy tại truyenyy[.c]om',
    'truyện được lấy tại t.r.u.y.ệ.n.y-y',
    'Đọc Truyện Online mới nhất ở truyen/y/y/com',
    'Truyện được copy tại TruyệnYY.com',
    'nguồn t r u y ệ n y_y',
    'Bạn đang xem truyện được sao chép tại: t.r.u.y.e.n.y.y chấm c.o.m',
    'Nguồn tại http://truyenyy[.c]om',
    'xem tại tr.u.y.ệ.n.yy',
    'Bạn đang đọc chuyện tại Truyện.YY',
  ];

  /* === DO NOT CHANGE CODE BELOW THIS LINE === */

  function html2text(html, noBr = false) {
    if (noBr) {
      html = jEpub.html2text(html, true);
    } else {
      html = jEpub.html2text(html);
      html = html.replace(/\n/g, '<br />');
    }
    return html;
  }

  function cleanHtml(str) {
    citeSources.forEach(function (source) {
      if (str.indexOf(source) !== -1) {
        str = str.replace(source, '');
        return false;
      }
    });
    str = str.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]+/gm, ''); // eslint-disable-line
    return str;
  }

  function downloadError(mess, err) {
    downloadStatus('red');
    if (err) console.error(mess);
    if (!chapTitle) return;

    titleError.push(chapTitle);
    if (errorAlert) errorAlert = confirm('Lỗi! ' + mess + '\nBạn có muốn tiếp tục nhận cảnh báo?');

    return '<p class="no-indent"><a href="' + referrer + '/' + chapId + '">' + mess + '</a></p>';
  }

  function beforeleaving(e) {
    e.preventDefault();
    e.returnValue = '';
  }

  function genEbook() {
    jepub
      .generate('blob', function (metadata) {
        $download.html(
          'Đang nén <strong>' + metadata.percent.toFixed(2) + '%</strong>',
        );
      })
      .then(function (epubZipContent) {
        document.title = '[⇓] ' + ebookTitle;
        window.removeEventListener('beforeunload', beforeleaving);

        $download
          .attr({
            href: window.URL.createObjectURL(epubZipContent),
            download: ebookFilename,
          })
          .html('Hoàn thành')
          .off('click');
        if (status !== 'red') downloadStatus('greenyellow');

        saveAs(epubZipContent, ebookFilename);
      })
      .catch(function (err) {
        downloadStatus('red');
        console.error(err);
      });
  }

  function saveEbook() {
    if (endDownload) return;
    endDownload = true;
    $download.html('Bắt đầu tạo EPUB');

    if (titleError.length) {
      titleError = '<p class="no-indent"><strong>Các chương lỗi: </strong>' + titleError.join(', ') + '</p>';
    } else {
      titleError = '';
    }
    beginEnd = '<p class="no-indent">Nội dung từ <strong>' + begin + '</strong> đến <strong>' + end + '</strong></p>';

    jepub.notes(beginEnd + titleError + '<br /><br />' + credits);

    GM.xmlHttpRequest({
      method: 'GET',
      url: ebookCover,
      responseType: 'arraybuffer',
      onload: function (response) {
        try {
          jepub.cover(response.response);
        } catch (err) {
          console.error(err);
        }
        genEbook();
      },
      onerror: function (err) {
        console.error(err);
        genEbook();
      },
    });
  }

  function getContent(pageId) {
    if (endDownload) return;
    chapId = pageId;

    $.get(pathname + '/' + chapId)
      .done(function (response) {
        var $data = $(response),
          $chapter = $data.find('#noi-dung'),
          $notContent = $chapter.find('iframe, script, style, a'),
          $referrer = $chapter.find('[style]').filter(function () {
            return this.style.fontSize === '1px' || this.style.fontSize === '0px' || this.style.color === 'white';
          }),
          chapContent,
          $next = $data.find('.page-next');

        if (endDownload) return;

        chapTitle = $data.find('#chuong-title').text().trim();
        if (chapTitle === '') chapTitle = 'Chương không có tiêu đề';

        if (!$chapter.length) {
          chapContent = downloadError('Không có nội dung');
        } else {
          var $img = $chapter.find('img');
          if ($img.length)
            $img.replaceWith(function () {
              return '<br /><a href="' + this.src + '">Click để xem ảnh</a><br />';
            });

          if ($notContent.length) $notContent.remove();
          if ($referrer.length) $referrer.remove();

          if ($chapter.text().trim() === '') {
            chapContent = downloadError('Nội dung không có');
          } else {
            if (status !== 'red') downloadStatus('yellow');
            chapContent = cleanHtml($chapter.html());
          }
        }

        jepub.add(chapTitle, chapContent);

        if (count === 0) begin = chapTitle;
        end = chapTitle;

        $download.html('Đang tải <strong>' + count + '</strong>');
        console.log('%cComplete: ' + chapId, 'color:green;');

        ++count;
        document.title = '[' + count + '] ' + pageName;

        if ($next.hasClass('invisible')) {
          saveEbook();
        } else {
          getContent(downloadId($next.attr('href')));
        }

      })
      .fail(function (err) {
        chapTitle = null;
        downloadError('Kết nối không ổn định', err);
        saveEbook();
      });

  }

  var pageName = document.title,
    $download = $('<a></a>', {
      href: '#download',
      style: 'background-color:lightblue; padding: 5px',
      text: 'Tải xuống',
    }),
    status,
    downloadStatus = function (label) {
      status = label;
      $download.css("background-color", status);
    },
    downloadId = function (url) {
      return url.trim().replace(/^.*\//, '');
    },
    $novelInfo = $('#chuong-list'),
    //chapListSize = $('.info .numbers li').eq(1).text().replace(/[^\d]/g, ''),
    chapId = '',
    chapTitle = '',
    count = 0,
    begin = '',
    end = '',
    endDownload = false,
    ebookTitle = $('h1').text().trim(),
    ebookAuthor = $('#tacgia a').text().trim(),
    ebookCover = $('#anhbia img').attr('src'),
    ebookDesc = $('#gioithieu').html(),
    ebookType = [],
    beginEnd = '',
    titleError = [],
    host = location.host,
    pathname = location.pathname,
    referrer = location.protocol + '//' + host + pathname,
    ebookFilename = pathname.slice(8) + '.epub',
    credits =
      '<p>Truyện được tải từ <a href="' +
      referrer +
      '">Bachngocsach</a></p><p>Userscript được viết bởi: <a href="https://lelinhtinh.github.io/jEpub/">Zzbaivong</a></p>',
    jepub;

  if (!$novelInfo.length) return;

  var $ebookType = $('#theloai a');
  if ($ebookType.length)
    $ebookType.each(function () {
      ebookType.push($(this).text().trim());
    });

  ebookDesc = html2text(ebookDesc);
  //console.log(ebookDesc);

  jepub = new jEpub();
  jepub
    .init({
      i18n: 'vi',
      title: ebookTitle,
      author: ebookAuthor,
      publisher: host,
      description: ebookDesc,
      tags: ebookType,
    })
    .uuid(referrer);

  $download.insertAfter('#truyen-nav a:last');
  $download.before('\r\n');
  $download.one('click contextmenu', function (e) {
    e.preventDefault();
    document.title = '[...] Vui lòng chờ trong giây lát';

    var firstChap = downloadId($novelInfo.find('a.chuong-link:first').attr('href'));
    var startFrom = firstChap;

    if (e.type === 'contextmenu') {
      $download.off('click');
      startFrom = prompt('Nhập ID chương truyện bắt đầu tải:', firstChap) || firstChap;
      startFrom = downloadId(startFrom);
    } else {
      $download.off('contextmenu');
    }

    console.log('%cBắt đầu: ' + startFrom, 'color:blue;');

    window.removeEventListener('beforeunload', beforeleaving);

    $download.one('click', function (e) {
      e.preventDefault();
      saveEbook();
    });

    getContent(startFrom);
  });
})(jQuery, window, document);
