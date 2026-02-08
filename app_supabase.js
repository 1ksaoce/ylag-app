// CHỈ DÙNG DUY NHẤT 1 THƯ VIỆN SUPABASE
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ============================================================
// 👇 THÔNG TIN SUPABASE CỦA BẠN (Đã điền sẵn)
const SUPABASE_URL = "https://vzdlblptjerxexntpxmq.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_CN1U4NNSA6Tbdic8Wtre0g_EtLlK6fN"; 
// ============================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// Giữ nguyên ID cũ để bạn không bị mất dữ liệu đang dùng
const SAVE_ID = "YLAG_Version_V2.0"; 

// --- DỮ LIỆU GỐC ---
let appData = {
    startDate: null, lastActive: new Date().toDateString(), streak: 0,
    habits: [ 
        {icon:"🕒", name:"Dậy sớm", done:false}, {icon:"❤️", name:"Sức khỏe", done:false}, 
        {icon:"⚡", name:"Thể dục", done:false}, {icon:"📚", name:"Học bài", done:false}, 
        {icon:"📖", name:"Đọc sách", done:false}, {icon:"✏️", name:"Viết lách", done:false} 
    ],
    tasks: [{name:"Dậy sớm 5h", done:false}, {name:"Đọc 10 trang sách", done:false}],
    sleepTime: "", wakeTime: "",
    mood: null, journal: "", 
    journalImages: [], 
    history: {} 
};

// --- 1. TẢI DỮ LIỆU ---
async function loadData() {
    try {
        const { data, error } = await supabase.from('ylag_data').select('content').eq('id', SAVE_ID).single();
        document.getElementById('loading').style.display = 'none';

        if (data && data.content) {
            let fetched = data.content;
            if(!fetched.history) fetched.history = {}; 
            if(!fetched.journalImages) fetched.journalImages = [];
            appData = {...appData, ...fetched};
            checkDay();
        } else {
            saveData();
        }
        renderUI();
    } catch (err) {
        console.error("Lỗi tải:", err);
        document.getElementById('loading').style.display = 'none';
        renderUI();
    }
}

// --- 2. LƯU DỮ LIỆU ---
async function saveData() {
    try {
        await supabase.from('ylag_data').upsert({ id: SAVE_ID, content: appData });
    } catch (err) { console.error("Lỗi lưu:", err); }
}

// --- LOGIC NGÀY THÁNG ---
function checkDay() {
    const today = new Date().toDateString();
    if (appData.lastActive !== today) {
        const allHabitsDone = appData.habits.every(h => h.done);
        const allTasksDone = appData.tasks.length === 0 || appData.tasks.every(t => t.done);

        if (allHabitsDone && allTasksDone) appData.streak += 1;
        else appData.streak = 0;

        archiveToday(appData.lastActive); 
        resetForNewDay(today);
        saveData();
    }
}

function archiveToday(dateKey) {
    let dayLabel = dateKey;
    if(appData.startDate) {
        const start = new Date(appData.startDate); start.setHours(0,0,0,0);
        const d = new Date(dateKey); d.setHours(0,0,0,0);
        const diff = Math.ceil((d - start) / (1000 * 60 * 60 * 24));
        if(diff >= 0) dayLabel = `Ngày ${diff + 1}`;
    }
    if (!appData.history) appData.history = {};
    
    appData.history[dateKey] = {
        label: dayLabel, dateStr: dateKey,
        habits: JSON.parse(JSON.stringify(appData.habits)),
        tasks: JSON.parse(JSON.stringify(appData.tasks)),
        mood: appData.mood, journal: appData.journal,
        images: JSON.parse(JSON.stringify(appData.journalImages)), 
        sleepTime: appData.sleepTime || "---",
        wakeTime: appData.wakeTime || "---",
        streakAtThatTime: appData.streak 
    };
}

function resetForNewDay(newDateStr) {
    appData.habits.forEach(h => h.done = false);
    appData.tasks.forEach(t => t.done = false);
    appData.mood = null; appData.journal = ""; 
    appData.journalImages = []; 
    appData.sleepTime = ""; appData.wakeTime = "";
    appData.lastActive = newDateStr;
}

// --- RENDER UI ---
function renderUI() {
    // 1. Day Counter
    if (!appData.startDate) {
        document.getElementById('dayCounter').innerText = "---"; document.getElementById('percentDisplay').innerText = "0%";
        document.getElementById('progressFill').style.width = "0%"; document.getElementById('startBtnArea').style.display = "block";
    } else {
        document.getElementById('startBtnArea').style.display = "none";
        const start = new Date(appData.startDate); const now = new Date();
        start.setHours(0,0,0,0); now.setHours(0,0,0,0);
        const diffTime = now - start; 
        let dayCount = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        if (dayCount < 1) dayCount = 1; if (dayCount > 90) dayCount = 90;
        document.getElementById('dayCounter').innerText = `Ngày ${dayCount} / 90`;
        let percent = (dayCount / 90) * 100;
        document.getElementById('progressFill').style.width = `${percent}%`;
        document.getElementById('percentDisplay').innerText = `${Math.round(percent)}%`;
    }
    document.getElementById('currentDateStr').innerText = new Date().toLocaleDateString('vi-VN');
    document.getElementById('streakDisplay').innerText = appData.streak;

    // 2. Habits
    const hC = document.getElementById('habitContainer'); hC.innerHTML = '';
    appData.habits.forEach((h, i) => {
        const div = document.createElement('div');
        div.className = `habit-btn tooltip-container ${h.done ? 'active' : ''}`;
        div.setAttribute('onclick', `toggleHabit(${i})`);
        div.innerHTML = `${h.icon}<div class="tooltip-text">${h.name}</div>`;
        hC.appendChild(div);
    });

    document.getElementById('sleepInput').value = appData.sleepTime || "";
    document.getElementById('wakeInput').value = appData.wakeTime || "";

    // Tasks
    const tC = document.getElementById('taskContainer'); tC.innerHTML = '';
    appData.tasks.forEach((t, i) => {
        const b = document.createElement('div');
        b.className = `task-btn ${t.done ? 'done' : ''}`;
        b.innerHTML = `<span>${t.name}</span> <span class="del-icon" onclick="delTask(${i}, event)">×</span>`;
        b.setAttribute('onclick', `toggleTask(${i}, event)`);
        tC.appendChild(b);
    });

    // Mood
    const mC = document.getElementById('moodContainer'); mC.innerHTML = '';
    const moodNames = ["Tuyệt vời", "Vui vẻ", "Bình thường", "Buồn", "Tức giận", "Lo âu"];
    ["😀","🙂","😐","😔","😡","😨"].forEach((e, i) => {
        const div = document.createElement('div');
        div.className = `mood-btn tooltip-container ${appData.mood === i ? 'selected' : ''}`;
        div.setAttribute('onclick', `selectMood(${i})`);
        div.innerHTML = `${e}<div class="tooltip-text">${moodNames[i]}</div>`;
        mC.appendChild(div);
    });

    // 3. Journal & Photos
    const journalBox = document.getElementById('journalInput');
    if (document.activeElement !== journalBox) journalBox.value = appData.journal;

    const photoGrid = document.getElementById('photoGrid');
    photoGrid.innerHTML = '';
    appData.journalImages.forEach((imgUrl, index) => {
        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'photo-thumbnail-container';
        thumbContainer.innerHTML = `<img src="${imgUrl}" class="photo-thumbnail" onclick="window.openLightbox('${imgUrl}')"><div class="remove-photo-small" onclick="removePhoto(${index})">×</div>`;
        photoGrid.appendChild(thumbContainer);
    });
    
    const addBtn = document.createElement('div');
    addBtn.className = 'add-photo-square';
    addBtn.onclick = () => document.getElementById('imgInput').click();
    addBtn.innerHTML = '+';
    photoGrid.appendChild(addBtn);
}

// --- ACTIONS ---
window.toggleHabit = (i) => { appData.habits[i].done = !appData.habits[i].done; saveData(); renderUI(); };
window.toggleTask = (i, e) => { if(e.target.className === 'del-icon') return; appData.tasks[i].done = !appData.tasks[i].done; saveData(); renderUI(); };
window.selectMood = (i) => { appData.mood = i; saveData(); renderUI(); };

window.processImage = async (input) => {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const status = document.getElementById('saveStatus'); status.innerText = "⏳..."; status.style.color = "blue";
        try {
            const fileName = `journal_${Date.now()}_${Math.floor(Math.random()*1000)}.jpg`;
            const { error } = await supabase.storage.from('images').upload(fileName, file, { cacheControl: '3600', upsert: false });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
            appData.journalImages.push(publicUrl);
            await saveData(); status.innerText = "✅"; status.style.color = "green"; setTimeout(() => status.innerText = "", 2000); renderUI();
        } catch (error) { console.error(error); alert("Lỗi tải ảnh: " + error.message); status.innerText = "❌"; }
    } input.value = ''; 
}
window.removePhoto = async (i) => { if(confirm("Xóa ảnh?")) { appData.journalImages.splice(i, 1); saveData(); renderUI(); } }

// --- 1. XUẤT EXCEL (ĐÃ XÓA CỘT ẢNH) ---
window.exportToCSV = () => {
    if (!appData.history || Object.keys(appData.history).length === 0) { alert("Chưa có dữ liệu!"); return; }
    
    // Header (Bỏ cột ảnh)
    let csvContent = "\ufeffNgày,Thứ tự,Dậy sớm,Sức khỏe,Thể dục,Học bài,Đọc sách,Viết lách,Ngủ,Dậy,Mood,Nhật ký\n";
    
    const sortedKeys = Object.keys(appData.history).sort((a, b) => new Date(a) - new Date(b));

    sortedKeys.forEach(k => {
        const h = appData.history[k];
        const hb = h.habits.map(x => x.done?"1":"0").join(",");
        const m = (h.mood!==null)? ["Tuyệt","Vui","Bình thường","Buồn","Giận","Lo"][h.mood] : "";
        const j = (h.journal||"").replace(/[\n,"]/g," "); 
        
        // Không còn cột imgFormula nữa
        csvContent += `${h.dateStr},${h.label},${hb},${h.sleepTime||""},${h.wakeTime||""},${m},"${j}"\n`;
    });
    
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csvContent],{type:'text/csv;charset=utf-8;'}));
    a.download = `YLAG_Report_TextOnly.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// --- 2. LOGIC LỊCH SỬ (THÊM CHÚ THÍCH MOOD) ---
window.openHistoryModal = () => {
    document.getElementById('historyModal').style.display = 'flex';
    document.getElementById('historyList').style.display = 'block';
    document.getElementById('historyDetail').style.display = 'none';
    const list = document.getElementById('historyList'); list.innerHTML = '';
    
    if (!appData.history || Object.keys(appData.history).length === 0) { 
        list.innerHTML = '<div style="text-align:center; color:#888;">Chưa có lịch sử.</div>'; return; 
    }

    // Mảng tên Mood để hiển thị
    const moodNames = ["Tuyệt vời", "Vui vẻ", "Bình thường", "Buồn", "Tức giận", "Lo âu"];
    const moodIcons = ["😀","🙂","😐","😔","😡","😨"];

    // Sắp xếp ngày mới nhất lên đầu
    Object.keys(appData.history).sort((a,b) => new Date(b) - new Date(a)).forEach(dateKey => {
        const data = appData.history[dateKey];
        const habitsDone = data.habits ? data.habits.filter(h => h.done).length : 0;
        
        // Xác định Mood và Tên Mood
        let mIcon = "😶"; 
        let mLabel = "";
        if (data.mood !== null && data.mood !== undefined) {
            mIcon = moodIcons[data.mood];
            mLabel = moodNames[data.mood];
        }

        const div = document.createElement('div'); 
        div.className = 'history-item';
        div.innerHTML = `
            <div>
                <div class="history-date" style="font-weight:bold; font-size:18px; color:#000;">${data.label||dateKey}</div>
                <div class="history-stats" style="font-size:13px; color:#666;">${data.dateStr}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:24px;">${mIcon}</div>
                <div style="font-size:10px; color:#555; margin-bottom:2px;">${mLabel}</div>
                <div style="font-size:12px; font-weight:bold;">${habitsDone}/6 ✅</div>
            </div>`;
        div.onclick = () => window.showHistoryDetail(data);
        list.appendChild(div);
    });
}

// --- 3. IN BÁO CÁO PDF ---
window.printReport = () => {
    if (!appData.history || Object.keys(appData.history).length === 0) { alert("Chưa có dữ liệu!"); return; }

    let htmlContent = `
    <html>
    <head>
        <title>Hành Trình YLAG</title>
        <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333; }
            h1 { text-align: center; color: #000; border-bottom: 3px solid #000; padding-bottom: 10px; }
            .day-block { margin-bottom: 30px; border: 1px solid #ccc; padding: 15px; border-radius: 8px; page-break-inside: avoid; }
            .day-header { display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-bottom: 1px dashed #eee; padding-bottom: 5px; margin-bottom: 10px; }
            .mood-icon { font-size: 24px; }
            .journal-text { background: #f9f9f9; padding: 10px; border-radius: 5px; font-style: italic; white-space: pre-wrap; }
            .photo-grid { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
            .report-img { width: 120px; height: 120px; object-fit: cover; border-radius: 5px; border: 1px solid #ddd; }
            .stats { font-size: 12px; color: #666; margin-top: 5px; }
        </style>
    </head>
    <body>
        <h1>NHẬT KÝ HÀNH TRÌNH 90 NGÀY</h1>
    `;

    const sortedKeys = Object.keys(appData.history).sort((a, b) => new Date(a) - new Date(b));

    sortedKeys.forEach(k => {
        const h = appData.history[k];
        const moodNames = ["Tuyệt vời", "Vui vẻ", "Bình thường", "Buồn", "Tức giận", "Lo âu"];
        const moodIcons = ["😀","🙂","😐","😔","😡","😨"];
        
        let mDisplay = "😶";
        if(h.mood !== null) mDisplay = `${moodIcons[h.mood]} ${moodNames[h.mood]}`;

        const habitsDone = h.habits.filter(x => x.done).length;
        
        let imagesHtml = "";
        if (h.images && h.images.length > 0) {
            imagesHtml = `<div class="photo-grid">`;
            h.images.forEach(img => { imagesHtml += `<img src="${img}" class="report-img">`; });
            imagesHtml += `</div>`;
        }

        htmlContent += `
        <div class="day-block">
            <div class="day-header">
                <span>${h.label} <span style="font-weight:normal; font-size:14px; color:#666">(${h.dateStr})</span></span>
                <span class="mood-icon">${mDisplay}</span>
            </div>
            <div class="stats">
                ✅ Thói quen: ${habitsDone}/6 | 🌙 Ngủ: ${h.sleepTime || "--"} | ☀️ Dậy: ${h.wakeTime || "--"}
            </div>
            <div style="margin-top:10px; font-weight:bold;">📝 Nhật ký:</div>
            <div class="journal-text">${h.journal || "Không ghi chép."}</div>
            ${imagesHtml}
        </div>
        `;
    });

    htmlContent += `</body></html>`;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 1000);
}

// --- UTILS KHÁC ---
window.closeHistoryModal = () => { document.getElementById('historyModal').style.display = 'none'; }
window.backToHistoryList = () => { document.getElementById('historyList').style.display = 'block'; document.getElementById('historyDetail').style.display = 'none'; }
window.showHistoryDetail = (data) => {
    document.getElementById('historyList').style.display = 'none'; document.getElementById('historyDetail').style.display = 'block';
    document.getElementById('detailDate').innerText = `${data.label} (${data.dateStr})`;
    const habitsDiv = document.getElementById('detailHabits'); habitsDiv.innerHTML = '';
    if(data.habits) data.habits.forEach((h, i) => { const div = document.createElement('div'); div.className = `history-habit-readonly ${h.done?'done':''}`; div.style.display = "inline-flex"; div.style.justifyContent = "center"; div.style.alignItems = "center"; div.style.width = "40px"; div.style.height = "40px"; div.style.borderRadius = "10px"; div.style.margin = "3px"; div.style.background = h.done ? "#FFD700" : "#eee"; div.style.fontSize = "20px"; div.innerHTML = h.icon; habitsDiv.appendChild(div); });
    document.getElementById('detailJournal').innerText = data.journal || "";
    const pGrid = document.getElementById('detailPhotos'); pGrid.innerHTML = '';
    if(data.images && data.images.length > 0) { data.images.forEach(src => { const img = document.createElement('img'); img.src = src; img.className = 'photo-thumbnail'; img.onclick = () => window.openLightbox(src); pGrid.appendChild(img); }); } 
    else { pGrid.innerHTML = '<span style="color:#999; font-size:12px;">Không có ảnh</span>'; }
}
window.downloadBackup = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([dataStr], { type: "application/json" }));
    a.download = `YLAG_Backup.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
window.restoreBackup = (input) => {
    const file = input.files[0]; if (!file) return;
    if(!confirm("Thay thế dữ liệu?")) { input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try { appData = JSON.parse(e.target.result); await saveData(); renderUI(); alert("✅ Khôi phục thành công!"); closeSettingsModal(); } 
        catch (err) { alert("Lỗi file: " + err.message); }
    };
    reader.readAsText(file); input.value = '';
}
window.simulateNewDay = () => {
    if(confirm("Giả lập qua ngày mới?")) {
        const fakeDateKey = new Date().toLocaleString('vi-VN'); 
        const allHabitsDone = appData.habits.every(h => h.done);
        const allTasksDone = appData.tasks.length === 0 || appData.tasks.every(t => t.done);
        if (allHabitsDone && allTasksDone) { appData.streak += 1; alert("🔥 Streak: " + appData.streak); } else { appData.streak = 0; alert("❌ Streak: 0"); }
        archiveToday(fakeDateKey + " (Simulated)");
        if (appData.startDate) { const s = new Date(appData.startDate); s.setDate(s.getDate() - 1); appData.startDate = s.toISOString(); }
        resetForNewDay(new Date().toDateString());
        saveData(); renderUI(); closeSettingsModal();
    }
}
window.autoSaveJournal = () => {
    const status = document.getElementById('saveStatus'); appData.journal = document.getElementById('journalInput').value;
    status.innerText = "Lưu..."; if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => { await saveData(); status.innerText = ""; }, 1500);
}
window.addTask = () => { const n = prompt("Nhiệm vụ mới:"); if(n) { appData.tasks.push({name:n, done:false}); saveData(); renderUI(); } };
window.delTask = (i, e) => { e.stopPropagation(); if(confirm("Xóa?")) { appData.tasks.splice(i, 1); saveData(); renderUI(); } };
window.saveTimeLog = () => { appData.sleepTime = document.getElementById('sleepInput').value; appData.wakeTime = document.getElementById('wakeInput').value; saveData(); };
window.openLightbox = (src) => { const lb = document.getElementById('lightbox'); document.getElementById('lightboxImg').src = src; lb.style.display = 'flex'; }
window.closeLightbox = () => { document.getElementById('lightbox').style.display = 'none'; }
window.hardReset = () => {
    if(confirm("RESET toàn bộ?")) {
        appData = { startDate: null, lastActive: new Date().toDateString(), streak: 0, habits: [{icon:"🕒", name:"Dậy sớm", done:false}, {icon:"❤️", name:"Sức khỏe", done:false}, {icon:"⚡", name:"Thể dục", done:false}, {icon:"📚", name:"Học bài", done:false}, {icon:"📖", name:"Đọc sách", done:false}, {icon:"✏️", name:"Viết lách", done:false}], tasks: [{name:"Dậy sớm 5h", done:false}], sleepTime: "", wakeTime: "", mood: null, journal: "", journalImages: [], history: {} };
        saveData(); renderUI(); closeSettingsModal();
    }
}
window.startChallenge = () => { if(confirm("Bắt đầu?")) { const now = new Date(); now.setHours(0,0,0,0); appData.startDate = now.toISOString(); appData.streak = 1; saveData(); renderUI(); } };
window.openSettingsModal = () => { document.getElementById('settingsModal').style.display = 'flex'; }
window.closeSettingsModal = () => { document.getElementById('settingsModal').style.display = 'none'; }
window.openAboutModal = () => { document.getElementById('aboutModal').style.display = 'flex'; }
window.closeAboutModal = () => { document.getElementById('aboutModal').style.display = 'none'; }

// KHỞI ĐỘNG
loadData();