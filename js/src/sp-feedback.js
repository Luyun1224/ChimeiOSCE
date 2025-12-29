// SP Feedback Module - SP對考試的滿意度回饋分析
import { API_CONFIG } from './config.js';
import { state } from './state.js';

// 從 API 獲取 SP 回饋數據
export async function fetchSpFeedbackData() {
    try {
        const response = await fetch(`${API_CONFIG.SP_FEEDBACK_API_URL}?t=${new Date().getTime()}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        if (!Array.isArray(data)) throw new Error("Format Error");
        return data;
    } catch (error) {
        console.error("SP Feedback Fetch Error:", error);
        throw error;
    }
}

// 篩選數據
export function applySpFilters(data, yearFilter, dateFilter, stationFilter) {
    const filtered = data.filter(row => {
        let dStr = (row.date || row.timestamp || '').toString();
        if(dStr.length >= 10) dStr = dStr.substring(0, 10);

        if (yearFilter !== 'all' && !dStr.includes(yearFilter)) return false;
        if (dateFilter !== 'all' && dStr !== dateFilter) return false;
        if (stationFilter !== 'all' && String(row.stationNumber) !== stationFilter) return false;
        return true;
    });
    return filtered;
}

// 處理數據並返回統計結果
export function renderSpDashboard(data) {
    const total = data.length;
    let qSums = Array(6).fill(0); // Q1-Q6
    let actualPlaysSum = 0;
    let idealPlaysSum = 0;
    let comments = [];
    
    data.forEach(row => {
        const scores = [row.q1, row.q2, row.q3, row.q4, row.q5, row.q6].map(v => Number(v) || 0);
        scores.forEach((v, i) => qSums[i] += v);
        
        actualPlaysSum += (Number(row.q4_1) || 0);
        idealPlaysSum += (Number(row.q4_2) || 0);
        
        if (row.q7_comment && String(row.q7_comment).trim() !== "") {
            comments.push(row.q7_comment);
        }
    });

    const qAvgs = qSums.map(s => total > 0 ? (s / total).toFixed(2) : 0);
    const totalAvg = total > 0 ? (qSums.reduce((a,b)=>a+b,0) / (total * 6)).toFixed(2) : 0;
    const avgActual = total > 0 ? (actualPlaysSum / total).toFixed(1) : 0;
    const avgIdeal = total > 0 ? (idealPlaysSum / total).toFixed(1) : 0;
    const workloadIndex = (idealPlaysSum > 0) ? Math.round((actualPlaysSum / idealPlaysSum) * 100) : 0;

    return {
        total,
        totalAvg,
        avgActual,
        avgIdeal,
        workloadIndex,
        qAvgs,
        comments
    };
}

// 渲染圖表
export function renderSpCharts(qAvgs, avgActual, avgIdeal) {
    // Radar Chart
    const ctxR = document.getElementById('sp-chart-radar')?.getContext('2d');
    if (ctxR) {
        if (state.spCharts.radar) state.spCharts.radar.destroy();
        const labels = ["Q1 劇本演出", "Q2 考前演練", "Q3 劇本訊息", "Q4 負擔感受", "Q5 換場休息", "Q6 聯繫作業"];
        state.spCharts.radar = new Chart(ctxR, {
            type: 'radar',
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: '平均滿意度', 
                    data: qAvgs, 
                    backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                    borderColor: '#000', 
                    borderWidth: 3, 
                    pointBackgroundColor: '#EAB936' 
                }] 
            },
            options: { 
                scales: { r: { min: 1, max: 5, ticks: { stepSize: 1 } } }, 
                maintainAspectRatio: false 
            }
        });
    }

    // Bar Chart
    const ctxW = document.getElementById('sp-chart-workload')?.getContext('2d');
    if (ctxW) {
        if (state.spCharts.bar) state.spCharts.bar.destroy();
        state.spCharts.bar = new Chart(ctxW, {
            type: 'bar',
            data: { 
                labels: ['實際演出次數', '建議適宜次數'], 
                datasets: [{ 
                    label: '次數', 
                    data: [avgActual, avgIdeal], 
                    backgroundColor: ['#1C4E8C', '#EAB936'], 
                    borderWidth: 2, 
                    borderColor: '#000' 
                }] 
            },
            options: { 
                maintainAspectRatio: false, 
                scales: { y: { beginAtZero: true } }, 
                plugins: { legend: { display: false } } 
            }
        });
    }
}

// 渲染評論分析
export function renderSpComments(comments) {
    // 關鍵字分析
    const stopWords = ["無", "沒有", "建議", "覺得", "的", "是", "很", "及", "與", "在", "了"];
    let wordCounts = {};
    comments.forEach(text => {
        String(text).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。，、！？]/g, " ").split(/\s+/).forEach(w => {
            if (w.length > 1 && !stopWords.includes(w)) wordCounts[w] = (wordCounts[w] || 0) + 1;
        });
    });
    const sorted = Object.entries(wordCounts).sort((a,b)=>b[1]-a[1]).slice(0, 8);
    
    const cloud = document.getElementById('sp-keyword-cloud');
    if (cloud) {
        cloud.innerHTML = '';
        sorted.forEach(([w, c]) => { 
            cloud.innerHTML += `<span class="keyword-tag">${w} (${c})</span>`; 
        });
    }

    const list = document.getElementById('sp-comments-list');
    if (list) {
        list.innerHTML = '';
        comments.slice(0, 30).forEach(c => {
            list.innerHTML += `<div class="p-2 bg-white border-l-4 border-black text-xs text-gray-700 shadow-sm mb-2">${c}</div>`;
        });
    }
}

// 渲染表格
export function renderSpTable(data) {
    const tbody = document.getElementById('sp-data-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    data.slice(0, 100).forEach(row => {
        let dStr = (row.date || '').toString();
        if(dStr.length >= 10) dStr = dStr.substring(0, 10);
        const tr = document.createElement('tr');
        tr.className = "border-b border-gray-200 text-xs hover:bg-gray-50";
        
        const sc = (v) => {
            let c = "text-center p-3 font-mono text-gray-600";
            let val = Number(v);
            if(val <= 2) c += " text-red-600 font-bold bg-red-50";
            else if(val >= 5) c += " text-[#1C4E8C] font-bold";
            return `<td class="${c}">${v||'-'}</td>`;
        };

        tr.innerHTML = `
            <td class="p-3 font-mono text-gray-500">${dStr}</td>
            <td class="p-3 font-bold">${row.spName || '-'}</td>
            <td class="p-3 text-center">${row.stationNumber || '-'}</td>
            ${sc(row.q1)}${sc(row.q2)}${sc(row.q3)}${sc(row.q4)}
            <td class="p-3 text-center font-bold text-[#1C4E8C]">${row.q4_1||'-'}</td>
            <td class="p-3 text-center font-bold text-[#EAB936]">${row.q4_2||'-'}</td>
            ${sc(row.q5)}${sc(row.q6)}
            <td class="p-3 truncate max-w-[200px]" title="${row.q7_comment || ''}">${row.q7_comment || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 匯出 CSV
export function exportSpCSV(data) {
    let csv = "日期,SP姓名,站號,Q1,Q2,Q3,Q4,實際次數,建議次數,Q5,Q6,Q7建議\n";
    data.forEach(row => {
        let d = (row.date || '').toString();
        if(d.length >= 10) d = d.substring(0, 10);
        let comment = (row.q7_comment || '').replace(/"/g, '""');
        csv += `"${d}","${row.spName}","${row.stationNumber}",${row.q1},${row.q2},${row.q3},${row.q4},${row.q4_1},${row.q4_2},${row.q5},${row.q6},"${comment}"\n`;
    });
    const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sp_feedback.csv";
    link.click();
}
