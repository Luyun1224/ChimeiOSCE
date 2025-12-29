// Main Entry Point - 整合所有模組
import { state, updateState } from './state.js';
import * as SPAnalysis from './sp-analysis.js';
import * as ExaminerFeedback from './examiner-feedback.js';
import * as StudentFeedback from './student-feedback.js';
import * as SPFeedback from './sp-feedback.js';
import * as UI from './ui.js';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    UI.initIcons();
    fetchAllData();
    setupEventListeners();
});

// 全域數據獲取
async function fetchAllData() {
    try {
        // 並行獲取所有數據
        const [spData, feedbackData, studentData, spFeedbackData] = await Promise.allSettled([
            SPAnalysis.fetchData(),
            ExaminerFeedback.fetchFeedbackData(),
            StudentFeedback.fetchStudentData(),
            SPFeedback.fetchSpFeedbackData()
        ]);

        if (spData.status === 'fulfilled') {
            updateState('globalData', spData.value);
            updateState('globalSpMap', SPAnalysis.generateSPMap(spData.value));
        }
        if (feedbackData.status === 'fulfilled') updateState('rawFeedbackData', feedbackData.value);
        if (studentData.status === 'fulfilled') updateState('rawStudentData', studentData.value);
        if (spFeedbackData.status === 'fulfilled') updateState('rawSpFeedbackData', spFeedbackData.value);

        // 初始渲染
        handleViewSwitch(state.currentView);
        UI.updateStatus("System Online", "green");
        
    } catch (error) {
        console.error("Fetch Error:", error);
        UI.updateStatus("API Error", "red");
    }
}

// 設置事件監聽器
function setupEventListeners() {
    // 篩選器變更
    const profFilter = document.getElementById('global-profession-filter');
    const yearFilter = document.getElementById('global-year-filter');
    const dateFilter = document.getElementById('global-date-filter');
    const stationFilter = document.getElementById('global-station-filter');

    if (profFilter) profFilter.addEventListener('change', handleGlobalFilterChange);
    if (yearFilter) yearFilter.addEventListener('change', handleGlobalFilterChange);
    if (dateFilter) dateFilter.addEventListener('change', handleGlobalFilterChange);
    if (stationFilter) stationFilter.addEventListener('change', handleGlobalFilterChange);

    // 視圖切換按鈕
    document.querySelectorAll('[id^="nav-"]').forEach(nav => {
        nav.addEventListener('click', (e) => {
            const viewName = nav.id.replace('nav-', '');
            UI.switchView(viewName, handleViewSwitch);
        });
    });

    // 側邊欄切換
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', UI.toggleSidebar);

    // 匯出 CSV 按鈕
    setupExportButtons();
}

// 處理篩選器變更
function handleGlobalFilterChange() {
    const currentView = state.currentView;
    
    if (currentView === 'examiner-sp-analysis') {
        handleSPAnalysisFilter();
    } else if (currentView === 'examiner-analysis') {
        handleExaminerFeedbackFilter();
    } else if (currentView === 'student-analysis') {
        handleStudentFeedbackFilter();
    } else if (currentView === 'sp-analysis') {
        handleSPFeedbackFilter();
    }
}

// SP 分析篩選處理
function handleSPAnalysisFilter() {
    const prof = document.getElementById('global-profession-filter')?.value || 'all';
    const year = document.getElementById('global-year-filter')?.value || 'all';
    const date = document.getElementById('global-date-filter')?.value || 'all';
    
    const filtered = SPAnalysis.filterData(prof, year, date);
    const stats = SPAnalysis.processData(filtered);
    
    // 更新統計數字
    UI.updateStats('stat-total-records', stats.total);
    UI.updateStats('stat-avg-score', stats.avgScore);
    UI.updateStats('stat-q1-score', stats.q1Avg);
    UI.updateStats('stat-q8-score', stats.q8Avg);
    
    // 渲染圖表和洞察
    if (stats.total > 0) {
        SPAnalysis.renderRadarChart(stats.qSums, stats.total);
        SPAnalysis.renderProfessionChart(stats.profStats);
        SPAnalysis.renderInsights(stats.qSums, stats.total, stats.allComments, stats.spPerformance);
    }
    SPAnalysis.renderTable(filtered);
}

// 考官回饋篩選處理
function handleExaminerFeedbackFilter() {
    const year = document.getElementById('global-year-filter')?.value || 'all';
    const date = document.getElementById('global-date-filter')?.value || 'all';
    const station = document.getElementById('global-station-filter')?.value || 'all';
    
    const filtered = ExaminerFeedback.applyFeedbackFilters(state.rawFeedbackData, year, date, station);
    const stats = ExaminerFeedback.renderFeedbackDashboard(filtered);
    
    UI.updateStats('fb-stat-count', stats.total);
    UI.updateStats('fb-stat-avg', stats.totalAvg);
    UI.updateStats('fb-stat-low', stats.lowestDim);
    UI.updateStats('fb-stat-low-score', stats.lowestScore);
    
    if (stats.total > 0) {
        ExaminerFeedback.renderFeedbackCharts(stats.labels, stats.qAvgs, stats.stationStats);
        ExaminerFeedback.renderFeedbackInsights(stats.comments, stats.minIdx, stats.lowestDim);
    }
    ExaminerFeedback.renderFeedbackTable(filtered);
}

// 學生回饋篩選處理
function handleStudentFeedbackFilter() {
    const year = document.getElementById('global-year-filter')?.value || 'all';
    const date = document.getElementById('global-date-filter')?.value || 'all';
    
    const filtered = StudentFeedback.applyStudentFilters(state.rawStudentData, year, date);
    const stats = StudentFeedback.renderStudentDashboard(filtered);
    
    UI.updateStats('stu-stat-count', stats.total);
    UI.updateStats('stu-stat-avg', stats.totalAvg);
    UI.updateStats('stu-stat-sp-score', stats.spAvg);
    UI.updateStats('stu-stat-difficulty-mode', stats.modeDiff);
    
    if (stats.total > 0) {
        StudentFeedback.renderStudentCharts(stats.qAvgs, stats.difficultyCounts);
        StudentFeedback.renderStudentInsights(stats.comments, stats.qAvgs, stats.modeDiff);
    }
    StudentFeedback.renderStudentTable(filtered);
}

// SP 回饋篩選處理
function handleSPFeedbackFilter() {
    const year = document.getElementById('global-year-filter')?.value || 'all';
    const date = document.getElementById('global-date-filter')?.value || 'all';
    const station = document.getElementById('global-station-filter')?.value || 'all';
    
    const filtered = SPFeedback.applySpFilters(state.rawSpFeedbackData, year, date, station);
    const stats = SPFeedback.renderSpDashboard(filtered);
    
    UI.updateStats('sp-stat-count', stats.total);
    UI.updateStats('sp-stat-avg', stats.totalAvg);
    UI.updateStats('sp-stat-avg-plays', stats.avgActual);
    
    const workloadEl = document.getElementById('sp-stat-workload');
    if (workloadEl) {
        workloadEl.innerText = stats.workloadIndex + "%";
        workloadEl.className = stats.workloadIndex > 110 
            ? "text-4xl font-black text-red-500" 
            : "text-4xl font-black text-white";
    }
    
    if (stats.total > 0) {
        SPFeedback.renderSpCharts(stats.qAvgs, stats.avgActual, stats.avgIdeal);
        SPFeedback.renderSpComments(stats.comments);
    }
    SPFeedback.renderSpTable(filtered);
}

// 視圖切換處理
function handleViewSwitch(viewName) {
    // 更新日期下拉選單
    let dataArr = [];
    if (viewName === 'examiner-sp-analysis') {
        dataArr = state.globalData;
        UI.updateDateDropdownForView(viewName, dataArr);
        handleSPAnalysisFilter();
    } else if (viewName === 'examiner-analysis') {
        dataArr = state.rawFeedbackData;
        UI.updateDateDropdownForView(viewName, dataArr);
        handleExaminerFeedbackFilter();
    } else if (viewName === 'student-analysis') {
        dataArr = state.rawStudentData.map(r => ({ date: r[2] }));
        UI.updateDateDropdownForView(viewName, dataArr);
        handleStudentFeedbackFilter();
    } else if (viewName === 'sp-analysis') {
        dataArr = state.rawSpFeedbackData.map(item => ({ date: item.date || item.timestamp }));
        UI.updateDateDropdownForView(viewName, dataArr);
        handleSPFeedbackFilter();
    }
}

// 設置匯出按鈕
function setupExportButtons() {
    const exportBtns = {
        'export-feedback-csv': () => ExaminerFeedback.exportFeedbackCSV(state.rawFeedbackData),
        'export-student-csv': () => StudentFeedback.exportStudentCSV(state.rawStudentData),
        'export-sp-csv': () => SPFeedback.exportSpCSV(state.rawSpFeedbackData)
    };

    Object.entries(exportBtns).forEach(([btnId, handler]) => {
        const btn = document.getElementById(btnId);
        if (btn) btn.addEventListener('click', handler);
    });
}

// 暴露全域函數 (供 HTML 中的 onclick 使用)
window.switchView = (viewName) => UI.switchView(viewName, handleViewSwitch);
window.toggleSidebar = UI.toggleSidebar;
window.closeModal = UI.closeModal;
window.handleGlobalFilterChange = handleGlobalFilterChange;
