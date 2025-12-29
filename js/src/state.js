// 全域狀態管理
export const state = {
    currentView: 'dashboard',
    globalData: [],
    globalSpMap: {},
    rawFeedbackData: [],
    rawStudentData: [],
    rawSpFeedbackData: [],
    
    // Chart Instances
    radarChartInstance: null,
    barChartInstance: null,
    feedbackCharts: {},
    studentCharts: {},
    spCharts: {}
};

// 狀態更新輔助函數
export function updateState(key, value) {
    state[key] = value;
}

export function getState(key) {
    return state[key];
}
