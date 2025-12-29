// SP Analysis Module - 考官對SP的評估分析
import { API_CONFIG } from './config.js';
import { state, updateState } from './state.js';

// 生成 SP 姓名遮罩
export function generateSPMap(data) {
    const uniqueNames = [...new Set(data.map(r => r.spName || r.SPName || "未知SP"))];
    const nameMap = {};
    const usedDisplayNames = {}; 
    uniqueNames.forEach(name => {
        if(name === "未知SP") { nameMap[name] = name; return; }
        let masked = (name.length <= 2) ? name.charAt(0) + "○" : name.charAt(0) + "○" + name.slice(-1);
        if (usedDisplayNames[masked]) { 
            usedDisplayNames[masked]++; 
            masked = `${masked} (${usedDisplayNames[masked]})`; 
        } else { 
            usedDisplayNames[masked] = 1; 
        }
        nameMap[name] = masked;
    });
    return nameMap;
}

// 從 API 獲取 SP 分析數據
export async function fetchData() {
    try {
        const response = await fetch(API_CONFIG.SP_API_URL);
        const data = await response.json();
        if(data.error) throw new Error(data.error);
        updateState('globalData', data);
        return data;
    } catch (error) {
        console.error("SP Fetch Error:", error);
        throw error;
    }
}

// 篩選數據
export function filterData(professionFilter, yearFilter, dateFilter) {
    const globalData = state.globalData;
    let filtered = globalData.filter(d => {
        if(professionFilter !== 'all' && !d.profession.includes(professionFilter)) return false;
        let dStr = (d.examDate && d.examDate.length > 10) ? d.examDate.substring(0, 10) : d.examDate;
        if(yearFilter !== 'all' && (!dStr || !dStr.includes(yearFilter))) return false;
        if(dateFilter !== 'all' && dStr !== dateFilter) return false;
        return true;
    });
    return filtered;
}

// 處理和計算數據
export function processData(data) {
    if (Object.keys(state.globalSpMap).length === 0) {
        updateState('globalSpMap', generateSPMap(state.globalData));
    }
    
    const total = data.length;
    let totalSum = 0; 
    let q1Sum = 0; 
    let q8Sum = 0; 
    let count = 0;
    let qSums = {q1:0, q2:0, q3:0, q4:0, q5:0, q6:0, q7:0, q8:0};
    let profStats = {}; 
    let spPerformance = {}; 
    let allComments = [];

    data.forEach(row => {
        const s = row.scores || {};
        const q1=s.q1||0; const q2=s.q2||0; const q3=s.q3||0; const q4=s.q4||0;
        const q5=s.q5||0; const q6=s.q6||0; const q7=s.q7||0; const q8=s.q8||0;
        let rowAvg = (q1+(q2>0?6-q2:0)+(q3>0?6-q3:0)+q4+q5+q6+q7+q8)/8; 
        totalSum += rowAvg; q1Sum += q1; q8Sum += q8; count++;
        qSums.q1+=q1; qSums.q2+=(6-q2); qSums.q3+=(6-q3); qSums.q4+=q4;
        qSums.q5+=q5; qSums.q6+=q6; qSums.q7+=q7; qSums.q8+=q8;

        const p = row.profession || "其他";
        if(!profStats[p]) profStats[p] = {sum:0, count:0};
        profStats[p].sum += rowAvg; profStats[p].count += 1;

        let sp = state.globalSpMap[row.spName||row.SPName||"未知SP"];
        if(!spPerformance[sp]) spPerformance[sp] = {sum:0, count:0};
        spPerformance[sp].sum += rowAvg; spPerformance[sp].count += 1;
        if(row.generalComment) allComments.push(row.generalComment);
    });

    return {
        total,
        avgScore: count ? (totalSum / count).toFixed(1) : "-",
        q1Avg: count ? (q1Sum / count).toFixed(1) : "-",
        q8Avg: count ? (q8Sum / count).toFixed(1) : "-",
        qSums,
        profStats,
        spPerformance,
        allComments
    };
}

// 渲染雷達圖
export function renderRadarChart(qSums, total) {
    const ctx = document.getElementById('chart-radar')?.getContext('2d');
    if (!ctx) return;
    
    const avgs = [
        qSums.q1/total, qSums.q2/total, qSums.q3/total, qSums.q4/total,
        qSums.q5/total, qSums.q6/total, qSums.q7/total, qSums.q8/total
    ].map(v => v.toFixed(2));

    if(state.radarChartInstance) state.radarChartInstance.destroy();
    
    state.radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ["Q1 角色", "Q2 避免操弄", "Q3 避免質疑", "Q4 身體", "Q5 表情", "Q6 肢體", "Q7 回答", "Q8 態度"],
            datasets: [{
                label: '平均得分',
                data: avgs,
                backgroundColor: 'rgba(28, 78, 140, 0.2)',
                borderColor: '#1C4E8C',
                pointBackgroundColor: '#EAB936',
                borderWidth: 3
            }]
        },
        options: {
            scales: { r: { min: 1, max: 5, ticks: { stepSize: 1 } } },
            maintainAspectRatio: false
        }
    });
}

// 渲染專業類別圖表
export function renderProfessionChart(profStats) {
    const ctx = document.getElementById('chart-profession')?.getContext('2d');
    if (!ctx) return;
    
    const labels = Object.keys(profStats);
    const data = labels.map(k => (profStats[k].sum / profStats[k].count).toFixed(2));
    
    if(state.barChartInstance) state.barChartInstance.destroy();
    
    state.barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '平均評分',
                data: data,
                backgroundColor: '#EAB936',
                borderColor: '#000',
                borderWidth: 2
            }]
        },
        options: {
            scales: { y: { min: 0, max: 5 } },
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// 渲染洞察分析
export function renderInsights(qSums, total, comments, spPerformance) {
    // 關鍵字分析
    const stopWords = ["無", "沒有", "sp", "的", "很", "也", "了", "有", "表現", "學生", "考生", "good", "ok", "尚可"];
    let wordCounts = {};
    comments.forEach(c => {
        const words = String(c).replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。，、！]/g," ").split(/\s+/);
        words.forEach(w => {
            if(w.length > 1 && !stopWords.includes(w.toLowerCase())) {
                wordCounts[w] = (wordCounts[w] || 0) + 1;
            }
        });
    });
    const sortedWords = Object.entries(wordCounts).sort((a,b) => b[1] - a[1]).slice(0, 10);
    
    const cloudContainer = document.getElementById('keyword-cloud');
    if (cloudContainer) {
        cloudContainer.innerHTML = '';
        sortedWords.forEach(([word, count]) => {
            const tag = document.createElement('span');
            const isNeg = ["小聲", "矛盾", "不自然", "過度", "差"].some(n => word.includes(n));
            tag.className = `keyword-tag ${isNeg ? 'keyword-neg' : 'keyword-pos'}`;
            tag.textContent = `${word} (${count})`;
            cloudContainer.appendChild(tag);
        });
    }

    // 最近評論
    const listContainer = document.getElementById('recent-comments-list');
    if (listContainer) {
        listContainer.innerHTML = '';
        comments.slice(-6).reverse().forEach(c => {
            const div = document.createElement('div');
            div.className = "text-xs border-b border-gray-100 pb-1 mb-1 text-gray-600";
            div.innerText = `"${c}"`;
            listContainer.appendChild(div);
        });
    }

    // SP 觀察名單
    const sortedSPs = Object.entries(spPerformance)
        .map(([name, data]) => ({name, avg: data.sum/data.count, count: data.count}))
        .sort((a,b) => a.avg - b.avg).slice(0, 3);
    
    const spListEl = document.getElementById('sp-watchlist');
    if (spListEl) {
        spListEl.innerHTML = '';
        if(sortedSPs.length > 0) {
            sortedSPs.forEach(sp => {
                const li = document.createElement('li');
                li.className = "flex justify-between items-center text-xs";
                const colorClass = sp.avg < 3.5 ? "text-red-400 font-bold" : "text-gray-300";
                li.innerHTML = `<span>${sp.name}</span> <span class="${colorClass}">${sp.avg.toFixed(1)} <span class="text-[10px] text-gray-500">(${sp.count}筆)</span></span>`;
                spListEl.appendChild(li);
            });
        } else {
            spListEl.innerHTML = '<li class="text-gray-500">無足夠數據</li>';
        }
    }

    // 行動計畫
    const avgs = { 
        "Q1 角色": qSums.q1/total, 
        "Q2 避免操弄": qSums.q2/total, 
        "Q3 避免質疑": qSums.q3/total, 
        "Q4 身體": qSums.q4/total, 
        "Q5 表情": qSums.q5/total, 
        "Q6 肢體": qSums.q6/total, 
        "Q7 回答": qSums.q7/total, 
        "Q8 態度": qSums.q8/total 
    };
    let minScore = 6; 
    let weakPoint = "";
    for (const [key, val] of Object.entries(avgs)) { 
        if(val < minScore) { 
            minScore = val; 
            weakPoint = key; 
        } 
    }
    
    const priorityEl = document.getElementById('action-priority');
    const suggestionEl = document.getElementById('action-suggestion');
    if (priorityEl) priorityEl.innerText = weakPoint + ` (Score: ${minScore.toFixed(1)})`;
    if (suggestionEl) suggestionEl.innerText = `針對「${weakPoint}」面向，建議安排 SP 進行工作坊回訓或個別指導。`;
}

// 渲染表格
export function renderTable(data) {
    const tbody = document.getElementById('table-comments-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    data.slice(0, 50).forEach(row => {
        let sp = state.globalSpMap[row.spName||row.SPName||"未知SP"];
        let tr = document.createElement('tr');
        tr.className = "border-b border-gray-200 text-xs hover:bg-gray-50";
        tr.innerHTML = `
            <td class="p-3">${row.examDate}</td>
            <td class="p-3 font-bold">${sp}</td>
            <td class="p-3">${row.examinerName}</td>
            <td class="p-3">${row.stationNumber}</td>
            <td class="p-3">${row.profession}</td>
            <td class="p-3">${row.scores.q1}</td>
            <td class="p-3 text-red-500">${row.scores.q2}</td>
            <td class="p-3 text-red-500">${row.scores.q3}</td>
            <td class="p-3">${row.scores.q4}</td>
            <td class="p-3">${row.scores.q5}</td>
            <td class="p-3">${row.scores.q6}</td>
            <td class="p-3">${row.scores.q7}</td>
            <td class="p-3">${row.scores.q8}</td>
            <td class="p-3 truncate max-w-[200px]">${row.generalComment||'-'}</td>
        `;
        tbody.appendChild(tr);
    });
}
