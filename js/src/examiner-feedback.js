// Examiner Feedback Module - 考官對考試滿意度分析
import { API_CONFIG } from './config.js';
import { state } from './state.js';

// 從 API 獲取考官回饋數據
export async function fetchFeedbackData() {
    try {
        const response = await fetch(API_CONFIG.FEEDBACK_API_URL);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (error) {
        console.error("Feedback Error", error);
        throw error;
    }
}

// 篩選數據
export function applyFeedbackFilters(data, yearFilter, dateFilter, stationFilter) {
    const filtered = data.filter(d => {
        let dStr = (d.date || d.examDate || '').substring(0, 10);
        if (yearFilter !== 'all' && !dStr.includes(yearFilter)) return false;
        if (dateFilter !== 'all' && dStr !== dateFilter) return false;
        if (stationFilter !== 'all' && String(d.stationNumber) !== stationFilter) return false;
        return true;
    });
    return filtered;
}

// 處理數據並返回統計結果
export function renderFeedbackDashboard(data) {
    const total = data.length;
    let qSums = Array(8).fill(0);
    let stationStats = {};
    let comments = [];
    
    data.forEach(row => {
        const scores = [row.q1, row.q2, row.q3, row.q4, row.q5, row.q6, row.q7, row.q8].map(v => Number(v) || 0);
        scores.forEach((v, i) => qSums[i] += v);
        const st = row.stationNumber || "Unk";
        if (!stationStats[st]) stationStats[st] = { sum: 0, count: 0 };
        const rowAvg = scores.reduce((a, b) => a + b, 0) / 8;
        stationStats[st].sum += rowAvg;
        stationStats[st].count++;
        if (row.q9) comments.push(row.q9);
        if (row.q10) comments.push(row.q10);
    });
    
    const qAvgs = qSums.map(s => total > 0 ? (s / total).toFixed(2) : 0);
    const totalAvg = total > 0 ? (qSums.reduce((a, b) => a + b, 0) / (total * 8)).toFixed(2) : 0;
    
    let minVal = 6, minIdx = -1;
    qAvgs.forEach((v, i) => { 
        if (Number(v) > 0 && Number(v) < minVal) { 
            minVal = Number(v); 
            minIdx = i; 
        } 
    });
    
    const labels = ["Q1 測驗內容", "Q2 評核項目", "Q3 評分說明", "Q4 試題指引", "Q5 測驗時間", "Q6 動線規劃", "Q7 廣播鈴聲", "Q8 試務流程"];
    
    return {
        total,
        totalAvg,
        lowestDim: minIdx >= 0 ? labels[minIdx] : "無",
        lowestScore: minIdx >= 0 ? minVal.toFixed(2) : "--",
        qAvgs,
        labels,
        stationStats,
        comments,
        minIdx
    };
}

// 渲染圖表
export function renderFeedbackCharts(labels, data, stationStats) {
    const ctxQ = document.getElementById('fb-chart-questions')?.getContext('2d');
    if (ctxQ) {
        if (state.feedbackCharts.q) state.feedbackCharts.q.destroy();
        state.feedbackCharts.q = new Chart(ctxQ, { 
            type: 'bar', 
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: '滿意度', 
                    data: data, 
                    backgroundColor: '#1C4E8C' 
                }] 
            }, 
            options: { 
                indexAxis: 'y', 
                maintainAspectRatio: false 
            } 
        });
    }
    
    const stLabels = Object.keys(stationStats).sort((a,b)=>Number(a)-Number(b));
    const stData = stLabels.map(k=>(stationStats[k].sum/stationStats[k].count).toFixed(2));
    const ctxS = document.getElementById('fb-chart-stations')?.getContext('2d');
    if (ctxS) {
        if (state.feedbackCharts.s) state.feedbackCharts.s.destroy();
        state.feedbackCharts.s = new Chart(ctxS, { 
            type: 'bar', 
            data: { 
                labels: stLabels.map(s=>`第${s}站`), 
                datasets: [{ 
                    label: '滿意度', 
                    data: stData, 
                    backgroundColor: '#EAB936' 
                }] 
            }, 
            options: { 
                maintainAspectRatio: false 
            } 
        });
    }
}

// 渲染洞察分析
export function renderFeedbackInsights(comments, lowestIdx, lowestDim) {
    const stopWords = ["無", "沒有", "建議", "考題", "的", "覺得", "尚可", "良好", "ok", "good", "是", "在"];
    let wordCounts = {};
    comments.forEach(c => {
        String(c).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。，、！]/g, " ").split(/\s+/).forEach(w => {
            if (w.length > 1 && !stopWords.includes(w.toLowerCase())) wordCounts[w] = (wordCounts[w] || 0) + 1;
        });
    });
    const sortedWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    const cloud = document.getElementById('fb-keyword-cloud');
    if (cloud) {
        cloud.innerHTML = '';
        if (sortedWords.length === 0) cloud.innerHTML = '<span class="text-gray-400 text-xs">無足夠資料分析</span>';
        sortedWords.forEach(([w, c]) => {
            const isNeg = ["不足", "太短", "吵", "動線", "難", "不佳"].some(n => w.includes(n));
            cloud.innerHTML += `<span class="keyword-tag ${isNeg ? 'keyword-neg' : 'keyword-pos'}">${w} (${c})</span>`;
        });
    }

    const listEl = document.getElementById('fb-comments-list');
    if (listEl) {
        listEl.innerHTML = '';
        comments.filter(c => c && String(c).trim() !== "").slice(-6).reverse().forEach(c => {
            listEl.innerHTML += `<div class="text-xs border-b border-gray-200 pb-2 mb-2 text-gray-700">"${c}"</div>`;
        });
    }

    const priorityEl = document.getElementById('fb-action-priority');
    const suggestionEl = document.getElementById('fb-action-suggestion');
    
    if (priorityEl) priorityEl.innerText = lowestDim || "無顯著問題";
    
    const actions = {
        0: "建議重新審視考題鑑別度與難易度分佈，或召開共識會議調整評分標準。",
        1: "評分項目可能過於繁瑣或模糊，建議簡化評核表或具體化行為指標。",
        2: "評分說明可能不夠明確，建議在考官共識營中加強說明或提供範例影片。",
        3: "試題指引資訊可能不足，建議增加考生端或考官端的背景資訊說明。",
        4: "測驗時間安排可能過於緊湊，建議檢視考題份量或考慮調整考試時間。",
        5: "動線規劃可能有改進空間，建議檢視考場標示或人員引導配置。",
        6: "廣播或鈴聲系統可能有干擾，建議檢查硬體設備或調整音量設定。",
        7: "試務流程有優化空間，建議加強試務人員培訓或標準化作業程序。"
    };
    
    if (suggestionEl) {
        suggestionEl.innerText = actions[lowestIdx] || "目前各面向表現良好，請持續保持監測。";
    }
}

// 渲染表格
export function renderFeedbackTable(data) {
    const tbody = document.getElementById('fb-data-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const getCell = (val) => {
        const n = Number(val);
        let cls = "text-center p-3 font-mono";
        if (n <= 2) cls += " text-red-600 font-bold bg-red-50";
        else if (n >= 5) cls += " text-[#1C4E8C] font-bold";
        else cls += " text-gray-600";
        return `<td class="${cls}">${n || '-'}</td>`;
    };
    
    data.slice(0, 100).forEach(row => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-gray-200 hover:bg-gray-50 text-xs transition-colors";
        const dateStr = (row.date || row.examDate || '').substring(0, 10);
        tr.innerHTML = `
            <td class="p-3 font-mono text-gray-500">${dateStr}</td>
            <td class="p-3 font-bold">${row.examinerName || '-'}</td>
            <td class="p-3 text-center"><span class="bg-black text-white px-2 py-0.5 rounded text-[10px]">${row.stationNumber}</span></td>
            ${getCell(row.q1)}${getCell(row.q2)}${getCell(row.q3)}${getCell(row.q4)}
            ${getCell(row.q5)}${getCell(row.q6)}${getCell(row.q7)}${getCell(row.q8)}
            <td class="p-3 text-gray-600 truncate max-w-[150px]" title="${row.q9}">${row.q9 || '-'}</td>
            <td class="p-3 text-gray-600 truncate max-w-[150px]" title="${row.q10}">${row.q10 || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 匯出 CSV
export function exportFeedbackCSV(data) {
    let csv = "日期,考官,站號,Q1,Q2,Q3,Q4,Q5,Q6,Q7,Q8,考題建議,整體建議\n";
    data.forEach(row => {
        const d = (row.date || row.examDate || '').substring(0, 10);
        const q9 = (row.q9 || '').replace(/"/g, '""');
        const q10 = (row.q10 || '').replace(/"/g, '""');
        csv += `"${d}","${row.examinerName}","${row.stationNumber}",${row.q1},${row.q2},${row.q3},${row.q4},${row.q5},${row.q6},${row.q7},${row.q8},"${q9}","${q10}"\n`;
    });
    const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "examiner_feedback.csv";
    link.click();
}
