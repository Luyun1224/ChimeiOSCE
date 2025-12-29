// UI Control Module - 處理視圖切換、篩選器、狀態更新等
import { state, updateState } from './state.js';

// 更新系統狀態顯示
export function updateStatus(msg, color) {
    const dot = document.getElementById('system-status-dot');
    const text = document.getElementById('system-status-text');
    const colors = { 
        green: 'bg-green-500', 
        yellow: 'bg-yellow-500', 
        red: 'bg-red-500' 
    };
    if (dot) dot.className = `w-2 h-2 rounded-full mr-2 ${colors[color]}`;
    if (text) text.innerText = msg;
}

// 切換側邊欄
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('-translate-x-full');
    if (overlay) overlay.classList.toggle('hidden');
}

// 關閉 Modal
export function closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) modal.classList.add('hidden');
}

// 顯示 Toast 訊息 (可選實作)
export function showToast(msg) {
    console.log("Toast:", msg);
    // 可以在此實作 toast 通知邏輯
}

// 更新日期下拉選單
export function updateDateDropdownForView(viewName, dataArr) {
    const dateSelect = document.getElementById('global-date-filter');
    if (!dateSelect) return;
    
    dateSelect.innerHTML = '<option value="all">全部場次 All Sessions</option>';
    
    const uniqueDates = [...new Set(dataArr.map(item => {
        let d = item.examDate || item.date;
        if(!d) return "";
        if(typeof d === 'string' && d.length >= 10) d = d.substring(0, 10);
        return d;
    }))].filter(d => d).sort().reverse();

    uniqueDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dateSelect.appendChild(option);
    });
}

// 視圖切換主函數
export function switchView(viewName, onSwitchCallback) {
    updateState('currentView', viewName);
    
    // 隱藏所有視圖
    const views = ['dashboard', 'examiner-sp-analysis', 'examiner-analysis', 'student-analysis', 'sp-analysis'];
    views.forEach(v => {
        const viewEl = document.getElementById(`view-${v}`);
        if (viewEl) {
            viewEl.classList.add('hidden');
            viewEl.classList.remove('block');
        }
        
        const nav = document.getElementById(`nav-${v}`);
        if(nav) {
            nav.classList.remove('active', 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]', 'transform', '-translate-y-1');
            nav.classList.add('opacity-70', 'border-transparent');
        }
    });

    // 顯示當前視圖
    const activeView = document.getElementById(`view-${viewName}`);
    if (activeView) {
        activeView.classList.remove('hidden');
        activeView.classList.add('block');
    }
    
    const activeNav = document.getElementById(`nav-${viewName}`);
    if(activeNav) {
        activeNav.classList.add('active', 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]', 'transform', '-translate-y-1');
        activeNav.classList.remove('opacity-70', 'border-transparent');
    }

    // 篩選器顯示邏輯
    const filters = document.getElementById('filters-panel');
    const grpProf = document.getElementById('filter-group-profession');
    const grpStat = document.getElementById('filter-group-station');
    
    if (filters) {
        filters.classList.remove('hidden');
        if (grpProf) grpProf.classList.add('hidden');
        if (grpStat) grpStat.classList.add('hidden');

        if (viewName === 'examiner-sp-analysis') {
            if (grpProf) grpProf.classList.remove('hidden');
        } 
        else if (viewName === 'examiner-analysis' || viewName === 'sp-analysis') {
            if (grpStat) grpStat.classList.remove('hidden');
        }
    }

    // 在手機版自動關閉側邊欄
    if(window.innerWidth < 768) {
        toggleSidebar();
    }
    
    // 執行回調函數 (用於觸發數據載入)
    if (onSwitchCallback && typeof onSwitchCallback === 'function') {
        onSwitchCallback(viewName);
    }
}

// 更新統計數字
export function updateStats(elementId, value) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = value;
}

// 初始化 Lucide 圖標
export function initIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}
