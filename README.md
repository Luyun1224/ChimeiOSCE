# 奇美醫院臨床技能中心 OSCE 問卷滿意度成效儀表板

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](CHANGELOG.md)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()

## 📋 專案說明
這是一個模組化的 OSCE (Objective Structured Clinical Examination) 滿意度分析儀表板系統，用於分析考官、學生與 SP (Standardized Patient) 的回饋數據。

## 📚 文件導覽

- 📖 [**快速參考**](QUICK-REFERENCE.md) - 常用命令和操作指南
- 🚀 [**部署指南**](DEPLOYMENT.md) - 詳細的部署說明
- 🏗️ [**架構文件**](ARCHITECTURE.md) - 系統架構與資料流程
- 📝 [**更新日誌**](CHANGELOG.md) - 版本更新記錄
- 📊 [**完成總結**](SUMMARY.md) - 模組化完成總結

## 🏗️ 專案結構

```
ChimeiOSCE/
├── index.html                 # 主 HTML 檔案
├── package.json              # Node.js 依賴配置
├── webpack.config.js         # Webpack 打包配置
├── js/
│   ├── src/                  # 原始模組化程式碼 (開發用)
│   │   ├── config.js         # API 配置
│   │   ├── state.js          # 狀態管理
│   │   ├── sp-analysis.js    # SP 分析邏輯
│   │   ├── examiner-feedback.js  # 考官回饋邏輯
│   │   ├── student-feedback.js   # 學生回饋邏輯
│   │   ├── sp-feedback.js    # SP 回饋邏輯
│   │   ├── ui.js             # UI 控制邏輯
│   │   └── main.js           # 主入口
│   └── app.min.js            # 打包後的壓縮檔案 (生產用)
└── README.md
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 開發模式

開發時使用此模式，程式碼會自動監看並重新編譯：

```bash
npm run dev
```

### 3. 生產環境打包

打包並壓縮程式碼用於部署：

```bash
npm run build
```

### 4. 本地預覽

啟動簡單的 HTTP 伺服器：

```bash
npm run serve
```

然後開啟瀏覽器訪問 `http://localhost:8000`

## 🔧 修改 API 配置

編輯 `js/src/config.js` 檔案來修改 API URLs：

```javascript
export const API_CONFIG = {
    SP_API_URL: "你的 API URL",
    FEEDBACK_API_URL: "你的 API URL",
    STUDENT_API_URL: "你的 API URL",
    SP_FEEDBACK_API_URL: "你的 API URL"
};
```

修改後記得重新執行 `npm run build`。

## 📦 模組說明

### config.js
- 存放所有 API 端點配置
- 集中管理便於維護

### state.js
- 全域狀態管理
- 存放所有數據和圖表實例

### sp-analysis.js
- 考官對 SP 評估的分析
- 包含數據處理、圖表渲染、洞察分析

### examiner-feedback.js
- 考官對考試滿意度回饋
- 包含問卷分析、站別統計

### student-feedback.js
- 學生對考試的回饋
- 包含難度分析、滿意度統計

### sp-feedback.js
- SP 對考試流程的回饋
- 包含工作負荷分析

### ui.js
- UI 控制邏輯
- 處理視圖切換、篩選器、狀態更新

### main.js
- 應用程式主入口
- 整合所有模組並初始化

## 🔐 程式碼保護

打包後的 `app.min.js` 具有以下特性：
- ✅ 程式碼壓縮 (Minified)
- ✅ 變數名稱混淆 (Mangled)
- ✅ 移除註解和空白
- ✅ 提升載入效能

原始模組化程式碼保留在 `js/src/` 目錄，便於維護和除錯。

## 📝 部署說明

1. 確保已執行 `npm run build` 打包程式碼
2. 上傳以下檔案到伺服器：
   - `index.html`
   - `js/app.min.js`
   - 其他靜態資源 (CSS, images 等)
3. 不需要上傳 `js/src/` 目錄和 `node_modules/`

## 🛠️ 開發流程

1. 修改 `js/src/` 中的模組檔案
2. 執行 `npm run build` 打包
3. 重新整理瀏覽器測試
4. 提交變更到版本控制

## 📊 瀏覽器相容性

- Chrome (推薦)
- Firefox
- Edge
- Safari 14+

## 📄 授權

© 2025 奇美醫院臨床技能中心
