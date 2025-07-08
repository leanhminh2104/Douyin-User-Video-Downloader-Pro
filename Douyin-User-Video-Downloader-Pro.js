// ==UserScript==
// @name         Douyin User Video Downloader Pro
// @namespace    https://douyin.com/
// @version      4.0
// @description  Tải video Douyin hàng loạt từ use
// @author       LAMDev
// @match        https://www.douyin.com/user/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let ENABLED = true;
    let FORMAT = 'txt';
    let CURRENT_DATA = [];

    /** Tạo icon toggle mở menu */
    function createToggleIcon() {
        const icon = document.createElement('div');
        icon.id = 'douyin-icon';
        icon.style = `
            position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px;
            background: #ff0050; border-radius: 50%; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer; z-index: 9999; display: flex; align-items: center; justify-content: center;
            color: white; font-size: 24px;
        `;
        icon.textContent = '⇩';
        icon.title = 'Douyin Downloader';
        icon.addEventListener('click', () => {
            const menu = document.getElementById('douyin-menu');
            if (menu) {
                menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
            }
        });
        document.body.appendChild(icon);
    }

    /** Tạo menu giao diện */
    function createMenu() {
        const menu = document.createElement('div');
        menu.id = 'douyin-menu';
        menu.style = `
            position: fixed; bottom: 80px; right: 20px; z-index: 9999;
            background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: Segoe UI, Roboto, sans-serif;
            width: 340px; display: none; font-size: 14px;
        `;
        menu.innerHTML = `
            <h4 style="margin:0 0 10px;font-size:16px;color:#333;">🎥 Douyin Downloader</h4>
            <label style="display:flex;align-items:center;margin-bottom:8px;">
                <input type="checkbox" id="toggle-enabled" checked style="margin-right:6px;"> Bật chức năng
            </label>
            <label style="display:block;margin-bottom:8px;">
                Định dạng xuất:
                <select id="format-select" style="margin-left:5px;padding:3px;">
                    <option value="txt">TXT</option>
                    <option value="json">JSON</option>
                </select>
            </label>
            <button id="run-script" style="margin-top:5px;padding:8px 12px;background:#ff0050;color:white;border:none;border-radius:5px;cursor:pointer;width:100%;font-size:14px;">📥 Quét Video</button>
            <button id="download-file" style="margin-top:5px;padding:8px 12px;background:#28a745;color:white;border:none;border-radius:5px;cursor:pointer;width:100%;font-size:14px;" disabled>💾 Tải File Link</button>
            <button id="download-selected" style="margin-top:5px;padding:8px 12px;background:#17a2b8;color:white;border:none;border-radius:5px;cursor:pointer;width:100%;font-size:14px;" disabled>⬇️ Tải Video Đã Chọn</button>
            <button id="select-all" style="margin-top:5px;padding:5px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;width:100%;font-size:13px;display:none;">✔️ Chọn Tất Cả</button>
            <button id="unselect-all" style="margin-top:5px;padding:5px;background:#6c757d;color:white;border:none;border-radius:4px;cursor:pointer;width:100%;font-size:13px;display:none;">❌ Bỏ Chọn Tất Cả</button>
            <div id="preview-container" style="margin-top:10px;max-height:280px;overflow:auto;border-top:1px solid #eee;padding-top:6px;"></div>
        `;
        document.body.appendChild(menu);

        // Gắn sự kiện
        document.getElementById('toggle-enabled').addEventListener('change', e => {
            ENABLED = e.target.checked;
        });
        document.getElementById('format-select').addEventListener('change', e => {
            FORMAT = e.target.value;
        });
        document.getElementById('run-script').addEventListener('click', () => {
            if (ENABLED) run();
            else alert("🔒 Chức năng đang bị tắt!");
        });
        document.getElementById('download-file').addEventListener('click', () => {
            if (CURRENT_DATA.length > 0) saveToFile(CURRENT_DATA, FORMAT);
        });
        document.getElementById('select-all').addEventListener('click', () => {
            document.querySelectorAll('.video-checkbox').forEach(cb => cb.checked = true);
        });
        document.getElementById('unselect-all').addEventListener('click', () => {
            document.querySelectorAll('.video-checkbox').forEach(cb => cb.checked = false);
        });
        document.getElementById('download-selected').addEventListener('click', async () => {
            const selected = Array.from(document.querySelectorAll('.video-checkbox:checked'));
            if (!selected.length) return alert("⚠️ Bạn chưa chọn video nào.");
            let failedList = [];

            for (const [index, cb] of selected.entries()) {
                const url = cb.dataset.url;
                if (!url) continue;
                console.log(`⬇️ Đang tải video ${index + 1}: ${url}`);

                try {
                    // Lưu ý: nếu bạn muốn chọn thư mục đích, hãy bật "Hỏi nơi lưu tệp" trong cài đặt trình duyệt
                    const now = new Date();
                    const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
                    await downloadBlob(url, `${dateStr}-douyin-video-${index + 1}.mp4`);


                    console.log(`✅ Video ${index + 1} đã tải xong.`);
                } catch (err) {
                    console.error(`❌ Lỗi tải video ${index + 1}:`, err);
                    failedList.push(index + 1);
                }
            }
            if (failedList.length) {
                alert(`❌ Một số video không tải được: ${failedList.join(", ")}`);
            }
        });
    }

    /** Tải blob và lưu file */
    async function downloadBlob(url, filename) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "blob";
            xhr.setRequestHeader("referer", "https://www.douyin.com/");
            xhr.onload = function () {
                if (xhr.status === 200) {
                    const blobUrl = window.URL.createObjectURL(xhr.response);
                    const a = document.createElement("a");
                    a.href = blobUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(blobUrl);
                    resolve();
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            };
            xhr.onerror = function () {
                reject(new Error("Network error"));
            };
            xhr.send();
        });
    }

    /** Gọi API lấy danh sách video */
    const getid = async function(sec_user_id, max_cursor) {
        const url = `https://www.douyin.com/aweme/v1/web/aweme/post/?device_platform=webapp&aid=6383&sec_user_id=${sec_user_id}&max_cursor=${max_cursor}&count=20`;
        const res = await fetch(url, {
            headers: { "user-agent": navigator.userAgent },
            credentials: "include"
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    };

    /** Lưu link video ra file txt/json */
    function saveToFile(data, format) {
        const content = format === 'json' ? JSON.stringify(data, null, 2) : data.map(d => d.url).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = format === 'json' ? 'douyin_links.json' : 'douyin_links.txt';
        a.click();
    }

    /** Thực thi quét video */
    const run = async function() {
        const result = [];
        let hasMore = 1;
        let max_cursor = 0;
        const sec_user_id = location.pathname.replace("/user/", "");

        const previewEl = document.getElementById('preview-container');
        previewEl.innerHTML = `⏳ Đang quét...`;
        document.getElementById('download-file').disabled = true;
        document.getElementById('download-selected').disabled = true;
        document.getElementById('select-all').style.display = 'none';
        document.getElementById('unselect-all').style.display = 'none';

        while (hasMore) {
            const data = await getid(sec_user_id, max_cursor);
            if (!data.aweme_list) break;
            for (const v of data.aweme_list) {
                const url = v.video?.play_addr?.url_list[0];
                if (url) result.push({ desc: v.desc || "No description", url: url.replace(/^http:/, "https:") });
            }
            hasMore = data.has_more;
            max_cursor = data.max_cursor;
        }

        CURRENT_DATA = result;
        if (result.length) {
            previewEl.innerHTML = result.map((v, i) => `
                <div style='margin:4px 0;'>
                    <input type='checkbox' class='video-checkbox' data-url='${v.url}' checked>
                    <strong>${i + 1}.</strong> <a href='${v.url}' target='_blank'>Link</a>
                    <div style='font-size:12px;color:#555;'>${v.desc}</div>
                </div>`).join('');
            document.getElementById('download-file').disabled = false;
            document.getElementById('download-selected').disabled = false;
            document.getElementById('select-all').style.display = 'block';
            document.getElementById('unselect-all').style.display = 'block';
        } else {
            previewEl.innerHTML = `❌ Không tìm thấy video.`;
        }
    };

    window.addEventListener('load', () => {
        createToggleIcon();
        createMenu();
    });
})();
