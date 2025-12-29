// Student Feedback Module - 學生對考試滿意度分析
import { API_CONFIG } from './config.js';
import { state } from './state.js';

// 從 API 獲取學生回饋數據
export async function fetchStudentData() {
    try {
        const response = await fetch(API_CONFIG.STUDENT_API_URL);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (error) {
        console.error("Student Fetch Error:", error);
        throw error;
    }
}

// 篩選數據
export function applyStudentFilters(data, yearFilter, dateFilter) {
    const filtered = data.filter(row => {
        let dStr = row[2]; // Index 2 is Date
        if (typeof dStr === 'string' && dStr.length > 10) dStr = dStr.substring(0, 10);
        if (yearFilter !== 'all' && !dStr.includes(yearFilter)) return false;
        if (dateFilter !== 'all' && dStr !== dateFilter) return false;
        return true;
    });
    return filtered;
}

// 處理數據並返回統計結果
export function renderStudentDashboard(data) {
    const total = data.length;
    let qSums = Array(9).fill(0);
    let difficultyCounts = {};
    let spScoreSum = 0;
    let comments = [];

    data.forEach(row => {
        // Indices: 3=Q1, 4=Q2, ... 11=Q9
        for (let i=0; i<9; i++) {
            let s = Number(row[i+3]) || 0;
            qSums[i] += s;
            if (i === 5) spScoreSum += s; // Q6
        }
        let diff = row[12] || "未填答";
        difficultyCounts[diff] = (difficultyCounts[diff] || 0) + 1;
        if (row[13]) comments.push({ text: row[13], type: '考題' });
        if (row[14]) comments.push({ text: row[14], type: '整體' });
    });

    const qAvgs = qSums.map(s => total > 0 ? (s / total).toFixed(2) : 0);
    const totalAvg = total > 0 ? (qSums.reduce((a,b)=>a+b,0)/(total*9)).toFixed(2) : 0;
    const spAvg = total > 0 ? (spScoreSum / total).toFixed(2) : 0;

    let maxCount = 0; 
    let modeDiff = "無";
    for (let [k, v] of Object.entries(difficultyCounts)) { 
        if(v > maxCount) { 
            maxCount=v; 
            modeDiff=k; 
        } 
    }

    return {
        total,
        totalAvg,
        spAvg,
        modeDiff,
        qAvgs,
        difficultyCounts,
        comments
    };
}

// 渲染圖表
export function renderStudentCharts(qAvgs, diffCounts) {
    // Radar Chart
    const ctxR = document.getElementById('stu-chart-radar')?.getContext('2d');
    if (ctxR) {
        if (state.studentCharts.radar) state.studentCharts.radar.destroy();
        const labels = ["Q1 內容", "Q2 動線", "Q3 指引", "Q4 SP時間", "Q5 SP難度", "Q6 SP演出", "Q7 技能時間", "Q8 技能難度", "Q9 流程"];
        state.studentCharts.radar = new Chart(ctxR, {
            type: 'radar',
            data: { 
                labels: labels, 
                datasets: [{ 
                    label: '平均滿意度', 
                    data: qAvgs, 
                    backgroundColor: 'rgba(28, 78, 140, 0.2)', 
                    borderColor: '#1C4E8C', 
                    borderWidth: 3 
                }] 
            },
            options: { 
                scales: { r: { min: 1, max: 5 } }, 
                maintainAspectRatio: false 
            }
        });
    }

    // Difficulty Pie Chart
    const ctxP = document.getElementById('stu-chart-difficulty')?.getContext('2d');
    if (ctxP) {
        if (state.studentCharts.pie) state.studentCharts.pie.destroy();
        const diffLabels = ["非常簡單", "簡單", "剛好", "困難", "非常困難"];
        const diffColors = ['#1C4E8C', '#60A5FA', '#EAB936', '#F87171', '#D03328'];
        const diffData = diffLabels.map(l => diffCounts[l] || 0);
        state.studentCharts.pie = new Chart(ctxP, {
            type: 'doughnut',
            data: { 
                labels: diffLabels, 
                datasets: [{ 
                    data: diffData, 
                    backgroundColor: diffColors, 
                    borderColor: '#1A1A1A', 
                    borderWidth: 2 
                }] 
            },
            options: { 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'bottom' } } 
            }
        });
    }
}

// 渲染洞察分析
export function renderStudentInsights(comments, qAvgs, modeDiff) {
    // 關鍵字分析
    const stopWords = ["無", "沒有", "建議", "覺得", "的", "是", "很", "有", "也", "了"];
    let wordCounts = {};
    comments.forEach(c => {
        String(c.text).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。，、！？]/g, " ").split(/\s+/).forEach(w => {
            if (w.length > 1 && !stopWords.includes(w)) wordCounts[w] = (wordCounts[w] || 0) + 1;
        });
    });
    const sorted = Object.entries(wordCounts).sort((a,b)=>b[1]-a[1]).slice(0, 10);
    
    const cloud = document.getElementById('stu-keyword-cloud');
    if (cloud) {
        cloud.innerHTML = '';
        sorted.forEach(([w, c]) => {
            cloud.innerHTML += `<span class="keyword-tag">${w} (${c})</span>`;
        });
    }

    // 分類評論
    const examList = document.getElementById('stu-comments-exam'); 
    const generalList = document.getElementById('stu-comments-general');
    
    if(examList) examList.innerHTML = '';
    if(generalList) generalList.innerHTML = '';

    const examComments = comments.filter(c => c.type === '考題').reverse().slice(0, 20);
    const generalComments = comments.filter(c => c.type === '整體').reverse().slice(0, 20);

    if(examList) {
        if(examComments.length === 0) {
            examList.innerHTML = '<div class="text-xs text-gray-400 text-center py-4">無考題建議</div>';
        } else {
            examComments.forEach(c => {
                examList.innerHTML += `<div class="p-2 bg-white border-l-4 border-[#1C4E8C] text-xs text-gray-700 shadow-sm mb-2">${c.text}</div>`;
            });
        }
    }

    if(generalList) {
        if(generalComments.length === 0) {
            generalList.innerHTML = '<div class="text-xs text-gray-400 text-center py-4">無整體建議</div>';
        } else {
            generalComments.forEach(c => {
                generalList.innerHTML += `<div class="p-2 bg-white border-l-4 border-[#D03328] text-xs text-gray-700 shadow-sm mb-2">${c.text}</div>`;
            });
        }
    }

    // 洞察分析
    let minScore = 6; 
    let minIdx = -1;
    qAvgs.forEach((s, i) => { 
        if(Number(s)>0 && Number(s)<minScore) { 
            minScore=Number(s); 
            minIdx=i; 
        } 
    });
    
    const labels = ["Q1 內容", "Q2 動線", "Q3 指引", "Q4 SP時間", "Q5 SP難度", "Q6 SP演出", "Q7 技能時間", "Q8 技能難度", "Q9 流程"];
    const suggestions = [
        "檢視考題與平日教學連結度，加強考前複習。", 
        "檢查考場標示是否脫落，優化移動動線。", 
        "增加試題指引範例，確保考生理解題意。", 
        "評估SP站考題份量，或考慮延長時間。", 
        "調整SP劇本難度，避免過於刁鑽。", 
        "加強SP演出訓練，確保表演一致性。", 
        "評估技能站操作繁瑣度，簡化流程。", 
        "檢視技能評分標準，避免過於嚴苛。", 
        "加強試務人員訓練，維持考場秩序。"
    ];
    
    const lowestEl = document.getElementById('stu-insight-lowest-dim');
    const scoreEl = document.getElementById('stu-insight-lowest-score');
    const actionEl = document.getElementById('stu-insight-action');
    
    if (lowestEl) lowestEl.innerText = minIdx >= 0 ? labels[minIdx] : "無";
    if (scoreEl) scoreEl.innerText = minIdx >= 0 ? `Score: ${minScore.toFixed(2)}` : "--";
    if (actionEl) actionEl.innerText = minIdx >= 0 ? suggestions[minIdx] : "各項指標表現良好。";
    
    let diffMsg = "難度適中";
    if(modeDiff.includes("困難")) diffMsg = "多數考生感到困難，建議檢視評分標準或教學內容。";
    else if(modeDiff.includes("簡單")) diffMsg = "多數考生認為簡單，可考慮增加考題鑑別度。";
    
    const diffEl = document.getElementById('stu-insight-difficulty');
    if (diffEl) diffEl.innerText = diffMsg;
}

// 渲染表格
export function renderStudentTable(data) {
    const tbody = document.getElementById('stu-data-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    data.slice(0, 50).forEach(row => {
        let dateStr = row[2];
        if(typeof dateStr === 'string' && dateStr.length > 10) dateStr = dateStr.substring(0, 10);
        const tr = document.createElement('tr');
        tr.className = "border-b border-gray-200 text-xs hover:bg-gray-50";
        
        // Helper for score color
        const sc = (v) => {
            let c = "text-center p-3 font-mono text-gray-600";
            if(v<=2) c += " text-red-600 font-bold bg-red-50";
            else if(v>=5) c += " text-[#1C4E8C] font-bold";
            return `<td class="${c}">${v||'-'}</td>`;
        };

        tr.innerHTML = `
            <td class="p-3 font-mono text-gray-400">${row[0]?new Date(row[0]).toLocaleTimeString():'-'}</td>
            <td class="p-3 font-bold text-[#1C4E8C]">${row[1]||'-'}</td>
            <td class="p-3 font-mono">${dateStr||'-'}</td>
            ${sc(row[3])}${sc(row[4])}${sc(row[5])}${sc(row[6])}${sc(row[7])}
            ${sc(row[8])}${sc(row[9])}${sc(row[10])}${sc(row[11])}
            <td class="p-3 text-center font-bold">${row[12]||'-'}</td>
            <td class="p-3 truncate max-w-[150px]">${row[13]||'-'}</td>
            <td class="p-3 truncate max-w-[150px]">${row[14]||'-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 匯出 CSV
export function exportStudentCSV(data) {
    let csv = "時間,姓名,日期,Q1,Q2,Q3,Q4,Q5,Q6,Q7,Q8,Q9,難度,考題建議,整體建議\n";
    data.forEach(row => {
        const time = row[0] ? new Date(row[0]).toLocaleTimeString() : '';
        const q13 = (row[13] || '').replace(/"/g, '""');
        const q14 = (row[14] || '').replace(/"/g, '""');
        csv += `"${time}","${row[1]}","${row[2]}",${row[3]},${row[4]},${row[5]},${row[6]},${row[7]},${row[8]},${row[9]},${row[10]},${row[11]},"${row[12]}","${q13}","${q14}"\n`;
    });
    const blob = new Blob(["\uFEFF"+csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "student_feedback.csv";
    link.click();
}
