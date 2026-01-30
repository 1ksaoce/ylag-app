import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- CẤU HÌNH ---
const firebaseConfig = {
    apiKey: "AIzaSyA59ex81_KmXzpJ5lCeVN0bEC_El3xREy8",
    authDomain: "ylag-ghost.firebaseapp.com",
    projectId: "ylag-ghost",
    storageBucket: "ylag-ghost.firebasestorage.app",
    messagingSenderId: "991277309303",
    appId: "1:991277309303:web:3a7be6a96c3e0592a2d572",
    measurementId: "G-H11610EVQC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DOC_ID = "user_profile_v15_final_split_files"; 

let appData = {
    startDate: null, lastActive: new Date().toDateString(), streak: 0,
    habits: [ 
        {icon:"🕒", name:"Dậy sớm", done:false}, {icon:"❤️", name:"Sức khỏe", done:false}, 
        {icon:"⚡", name:"Thể dục", done:false}, {icon:"💡", name:"Sáng tạo", done:false}, 
        {icon:"📖", name:"Đọc sách", done:false}, {icon:"✏️", name:"Viết lách", done:false} 
    ],
    tasks: [{name:"Dậy sớm 5h", done:false}, {name:"Đọc 10 trang sách", done:false}],
    mood: null, journal: "", journalImages: [],
    history: {} 
};

const docRef = doc(db, "ylag_db", DOC_ID);

onSnapshot(docRef, (snap) => {
    document.getElementById('loading').style.display = 'none';
    if (snap.exists()) {
        let fetched = snap.data();
        if(!fetched.history) fetched.history = {}; 
        if(!fetched.journalImages) fetched.journalImages = [];
        appData = {...appData, ...fetched};
        checkDay();
        renderUI();
    } else {
        saveData();
        renderUI();
    }
});

async function saveData() { await setDoc(docRef, appData); }

// --- LOGIC NGÀY THÁNG & LỊCH SỬ ---
function checkDay() {
    const today = new Date().toDateString();
    if (appData.lastActive !== today) {
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
    
    // LƯU CẢ TASKS VÀO LỊCH SỬ
    appData.history[dateKey] = {
        label: dayLabel, dateStr: dateKey,
        habits: JSON.parse(JSON.stringify(appData.habits)),
        tasks: JSON.parse(JSON.stringify(appData.tasks)), 
        mood: appData.mood, journal: appData.journal,
        images: JSON.parse(JSON.stringify(appData.journalImages))
    };
}

function resetForNewDay(newDateStr) {
    appData.habits.forEach(h => h.done = false);
    appData.tasks.forEach(t => t.done = false);
    appData.mood = null; appData.journal = ""; appData.journalImages = [];
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
        div.setAttribute('data-color', i);
        div.setAttribute('onclick', `toggleHabit(${i})`);
        div.innerHTML = `${h.icon}<div class="tooltip-text">${h.name}</div>`;
        hC.appendChild(div);
    });

    // 3. Tasks
    const tC = document.getElementById('taskContainer'); tC.innerHTML = '';
    appData.tasks.forEach((t, i) => {
        const b = document.createElement('div');
        b.className = `task-btn ${t.done ? 'done' : ''}`;
        b.innerHTML = `<span>${t.name}</span> <span class="del-icon" onclick="delTask(${i}, event)">×</span>`;
        b.onclick = (e) => { if(e.target.className !== 'del-icon') { appData.tasks[i].done = !appData.tasks[i].done; saveData(); renderUI(); }};
        tC.appendChild(b);
    });

    // 4. Mood
    const mC = document.getElementById('moodContainer'); mC.innerHTML = '';
    const moodNames = ["Tuyệt vời", "Vui vẻ", "Bình thường", "Buồn", "Tức giận", "Lo âu"];
    ["😀","🙂","😐","😔","😡","😨"].forEach((e, i) => {
        const div = document.createElement('div');
        div.className = `mood-btn tooltip-container ${appData.mood === i ? 'selected' : ''}`;
        div.setAttribute('onclick', `selectMood(${i})`);
        div.innerHTML = `${e}<div class="tooltip-text">${moodNames[i]}</div>`;
        mC.appendChild(div);
    });

    // 5. Journal & Photos (Integrated)
    const journalBox = document.getElementById('journalInput');
    if (document.activeElement !== journalBox) { journalBox.value = appData.journal; }

    const photoGrid = document.getElementById('photoGrid');
    photoGrid.innerHTML = '';
    appData.journalImages.forEach((imgData, index) => {
        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'photo-thumbnail-container';
        thumbContainer.innerHTML = `<img src="${imgData}" class="photo-thumbnail"><div class="remove-photo-small" onclick="removePhoto(${index})">×</div>`;
        photoGrid.appendChild(thumbContainer);
    });

    if (appData.journalImages.length < 3) {
        const addBtn = document.createElement('div');
        addBtn.className = 'add-photo-square';
        addBtn.onclick = () => document.getElementById('imgInput').click();
        addBtn.innerHTML = '+';
        photoGrid.appendChild(addBtn);
    }
}

// --- GLOBAL FUNCTIONS ---
window.toggleHabit = (index) => { appData.habits[index].done = !appData.habits[index].done; saveData(); renderUI(); };
window.selectMood = (index) => { appData.mood = index; saveData(); renderUI(); };

let saveTimeout;
window.autoSaveJournal = () => {
    const status = document.getElementById('saveStatus');
    appData.journal = document.getElementById('journalInput').value;
    status.innerText = "Đang lưu..."; status.style.color = "#999";
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => { await saveData(); status.innerText = "Đã lưu ✓"; status.style.color = "green"; setTimeout(() => { status.innerText = ""; }, 2000); }, 1500);
}

window.simulateNewDay = () => {
    if(confirm("Xác nhận: Lưu dữ liệu hôm nay vào Lịch sử và chuyển sang ngày mai?")) {
        const fakeDateKey = new Date().toLocaleString('vi-VN'); 
        archiveToday(fakeDateKey + " (Simulated)");
        
        // Mẹo: Lùi ngày bắt đầu để tăng bộ đếm
        if (appData.startDate) {
            const s = new Date(appData.startDate);
            s.setDate(s.getDate() - 1);
            appData.startDate = s.toISOString();
        }
        resetForNewDay(new Date().toDateString());
        saveData(); renderUI();
        alert("Đã qua ngày mới! Kiểm tra Lịch sử và Bộ đếm ngày.");
    }
}

window.startChallenge = () => { 
    if(confirm("Bắt đầu thử thách ngay bây giờ?")) { 
        const now = new Date(); now.setHours(0,0,0,0);
        appData.startDate = now.toISOString(); 
        appData.streak = 1; 
        saveData(); renderUI();
    } 
};

// History Modal
window.openHistoryModal = () => {
    document.getElementById('historyModal').style.display = 'flex';
    document.getElementById('historyList').style.display = 'block';
    document.getElementById('historyDetail').style.display = 'none';
    const list = document.getElementById('historyList'); list.innerHTML = '';
    if (!appData.history || Object.keys(appData.history).length === 0) { list.innerHTML = '<div style="text-align:center; color:#888;">Chưa có lịch sử.</div>'; return; }
    Object.keys(appData.history).reverse().forEach(dateKey => {
        const data = appData.history[dateKey];
        const div = document.createElement('div'); div.className = 'history-item';
        const habitsDone = data.habits ? data.habits.filter(h => h.done).length : 0;
        const moodIcon = data.mood !== null && data.mood !== undefined ? ["😀","🙂","😐","😔","😡","😨"][data.mood] : "😶";
        div.innerHTML = `<div><div class="history-date">${data.label || dateKey}</div><div class="history-stats">${data.dateStr}</div></div><div style="text-align:right;"><div style="font-size:18px;">${moodIcon}</div><div style="font-size:11px; font-weight:bold;">${habitsDone}/6 ✅</div></div>`;
        div.onclick = () => window.showHistoryDetail(data);
        list.appendChild(div);
    });
}

window.showHistoryDetail = (data) => {
    document.getElementById('historyList').style.display = 'none'; document.getElementById('historyDetail').style.display = 'block';
    document.getElementById('detailDate').innerText = `${data.label} (${data.dateStr})`;
    
    // Habits
    const habitsDiv = document.getElementById('detailHabits'); habitsDiv.innerHTML = '';
    if(data.habits) data.habits.forEach((h, i) => { const div = document.createElement('div'); div.className = `history-habit-readonly ${h.done?'done':''}`; div.setAttribute('data-color', i); div.innerHTML = h.icon; habitsDiv.appendChild(div); });
    
    // Tasks (Fix)
    const tasksDiv = document.getElementById('detailTasks'); tasksDiv.innerHTML = '';
    if(data.tasks && data.tasks.length > 0) data.tasks.forEach(t => { const item = document.createElement('div'); item.className = 'history-task-item'; item.innerHTML = `<div class="history-task-icon">${t.done ? '✅' : '⬜'}</div><div class="history-task-text ${t.done ? 'done' : ''}">${t.name}</div>`; tasksDiv.appendChild(item); }); else tasksDiv.innerHTML = '<span style="color:#999; font-size:12px;">Không có dữ liệu nhiệm vụ</span>';

    // Mood
    const moods = ["Tuyệt vời", "Vui vẻ", "Bình thường", "Buồn", "Tức giận", "Lo âu"]; const moodIcons = ["😀","🙂","😐","😔","😡","😨"];
    const m = data.mood; const moodContainer = document.getElementById('detailMood');
    if (m !== null && m !== undefined) moodContainer.innerHTML = `<div class="history-mood-container"><div class="history-mood-emoji">${moodIcons[m]}</div><div class="history-mood-label">${moods[m]}</div></div>`; else moodContainer.innerHTML = '<span style="color:#999; font-size:12px;">Không ghi nhận</span>';

    document.getElementById('detailJournal').innerText = data.journal || "Không có nhật ký.";
    
    // Photos
    const pGrid = document.getElementById('detailPhotos'); pGrid.innerHTML = '';
    if(data.images && data.images.length > 0) data.images.forEach(src => { const img = document.createElement('img'); img.src = src; img.className = 'photo-thumbnail'; img.style.cursor = 'zoom-in'; img.onclick = () => window.openLightbox(src); pGrid.appendChild(img); }); else pGrid.innerHTML = '<span style="color:#999; font-size:12px;">Không có ảnh</span>';
}

window.backToHistoryList = () => { document.getElementById('historyList').style.display = 'block'; document.getElementById('historyDetail').style.display = 'none'; }
window.closeHistoryModal = () => { document.getElementById('historyModal').style.display = 'none'; }
window.openLightbox = (src) => { const lb = document.getElementById('lightbox'); document.getElementById('lightboxImg').src = src; lb.style.display = 'flex'; }
window.closeLightbox = () => { document.getElementById('lightbox').style.display = 'none'; }

window.processImage = (input) => {
    if (appData.journalImages.length >= 3) { alert("Tối đa 3 ảnh!"); return; }
    if (input.files && input.files[0]) {
        const file = input.files[0]; const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image(); img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
                const MAX_WIDTH = 500; let width = img.width; let height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height; ctx.drawImage(img, 0, 0, width, height);
                appData.journalImages.push(canvas.toDataURL('image/jpeg', 0.6)); saveData(); renderUI();
            }
        }
        reader.readAsDataURL(file);
    } input.value = '';
}
window.removePhoto = (index) => { if(confirm("Xóa ảnh?")) { appData.journalImages.splice(index, 1); saveData(); renderUI(); } }
window.addTask = () => { const n = prompt("Nhiệm vụ mới:"); if(n) { appData.tasks.push({name:n, done:false}); saveData(); renderUI(); } };
window.delTask = (i, e) => { e.stopPropagation(); if(confirm("Xóa nhiệm vụ?")) { appData.tasks.splice(i, 1); saveData(); renderUI(); } };   

// --- HÀM RESET DỮ LIỆU ---
window.hardReset = () => {
    if(confirm("CẢNH BÁO: Bạn có chắc muốn XÓA SẠCH toàn bộ dữ liệu? Hành động này không thể hoàn tác!")) {
        // 1. Trả về dữ liệu gốc
        appData = {
            startDate: null, 
            lastActive: new Date().toDateString(), 
            streak: 0,
            habits: [ 
                {icon:"🕒", name:"Dậy sớm", done:false}, {icon:"❤️", name:"Sức khỏe", done:false}, 
                {icon:"⚡", name:"Thể dục", done:false}, {icon:"💡", name:"Sáng tạo", done:false}, 
                {icon:"📖", name:"Đọc sách", done:false}, {icon:"✏️", name:"Viết lách", done:false} 
            ],
            tasks: [{name:"Dậy sớm 5h", done:false}, {name:"Đọc 10 trang sách", done:false}],
            mood: null, journal: "", journalImages: [],
            history: {} 
        };
        
        // 2. Lưu lên Firebase và vẽ lại giao diện
        saveData();
        renderUI();
        alert("Đã xóa dữ liệu thành công!");
    }
}