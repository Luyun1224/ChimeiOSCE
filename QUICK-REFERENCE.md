# 快速參考指南

## 📋 常用命令

### 建置與開發
```bash
# 安裝依賴 (首次執行)
npm install

# 開發模式 (自動重新編譯)
npm run dev

# 生產環境打包
npm run build

# 啟動本地伺服器
npm run serve

# 一鍵啟動 (推薦)
./start.sh
```

## 📂 重要檔案位置

| 檔案 | 用途 | 是否上傳 |
|------|------|----------|
| `index.html` | 主頁面 | ✅ 是 |
| `js/app.min.js` | 打包後的程式碼 | ✅ 是 |
| `js/src/*.js` | 原始模組 (開發用) | ❌ 否 |
| `package.json` | 依賴配置 | ❌ 否 |
| `webpack.config.js` | 打包配置 | ❌ 否 |
| `node_modules/` | 依賴套件 | ❌ 否 |

## 🔧 常見修改

### 修改 API URL
```bash
# 1. 編輯配置檔
vim js/src/config.js

# 2. 修改 API URLs
export const API_CONFIG = {
    SP_API_URL: "新的URL",
    // ...
};

# 3. 重新打包
npm run build
```

### 修改分析邏輯
```bash
# 1. 選擇對應模組
vim js/src/sp-analysis.js        # SP 分析
vim js/src/examiner-feedback.js  # 考官回饋
vim js/src/student-feedback.js   # 學生回饋
vim js/src/sp-feedback.js        # SP 回饋

# 2. 修改程式碼

# 3. 重新打包
npm run build
```

### 修改 UI 行為
```bash
# 編輯 UI 模組
vim js/src/ui.js

# 重新打包
npm run build
```

## 🐛 除錯技巧

### 查看編譯錯誤
```bash
npm run build
# 錯誤會直接顯示在終端
```

### 開發模式除錯
```bash
# 使用開發模式 (未壓縮)
npm run dev

# 在瀏覽器中按 F12 開啟開發者工具
# 在 Console 標籤查看錯誤訊息
```

### 檢查打包後的檔案
```bash
# 查看檔案大小
ls -lh js/app.min.js

# 查看前 500 字元
head -c 500 js/app.min.js
```

## 📦 部署清單

### 上傳前檢查
- [ ] 執行 `npm run build` 完成打包
- [ ] 確認 `js/app.min.js` 存在
- [ ] 測試本地功能正常 (`npm run serve`)

### 需要上傳的檔案
```
✅ index.html
✅ js/app.min.js
✅ Examiner-Feedback.html (如果需要)
✅ SP-Assessment-Examiner.html (如果需要)
✅ SP-Feedback.html (如果需要)
✅ Student-Feedback.html (如果需要)
```

### 不需要上傳
```
❌ js/src/ (原始碼)
❌ node_modules/ (依賴)
❌ package.json
❌ package-lock.json
❌ webpack.config.js
❌ .gitignore
❌ README.md
❌ DEPLOYMENT.md
❌ SUMMARY.md
❌ CHANGELOG.md
❌ start.sh
```

## 🔍 檔案結構說明

```
ChimeiOSCE/
│
├── index.html              # 主頁面 ⭐
│
├── js/
│   ├── app.min.js          # 打包後程式碼 ⭐ (上傳)
│   └── src/                # 原始模組 🔧 (開發)
│       ├── config.js       # API 配置
│       ├── state.js        # 狀態管理
│       ├── main.js         # 主入口
│       ├── ui.js           # UI 控制
│       ├── sp-analysis.js
│       ├── examiner-feedback.js
│       ├── student-feedback.js
│       └── sp-feedback.js
│
├── package.json            # 依賴管理
├── webpack.config.js       # 打包配置
├── start.sh               # 啟動腳本
│
└── 說明文件/
    ├── README.md           # 使用說明
    ├── DEPLOYMENT.md       # 部署指南
    ├── SUMMARY.md          # 完成總結
    └── CHANGELOG.md        # 更新日誌
```

## ⚡ 效能指標

- **原始程式碼**: ~50KB (未壓縮)
- **壓縮後**: 28KB (減少 44%)
- **模組數量**: 8 個
- **總行數**: 1,339 行

## 🔒 安全性檢查

- ✅ 程式碼已混淆
- ✅ 變數名稱已加密
- ✅ 移除所有註解
- ⚠️ API URLs 仍可見 (需後端保護)

## 📞 需要幫助?

1. 查看 [README.md](README.md) - 詳細使用說明
2. 查看 [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
3. 查看 [SUMMARY.md](SUMMARY.md) - 完成總結
4. 查看瀏覽器控制台錯誤訊息
5. 檢查 Node.js 版本 (`node -v` >= 14.0)

---

💡 **提示**: 將此文件加入書籤，方便隨時查閱!
