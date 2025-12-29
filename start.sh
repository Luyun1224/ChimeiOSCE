#!/bin/bash

# ChimeiOSCE 快速啟動腳本

echo "🏥 奇美醫院 OSCE 儀表板 - 快速啟動"
echo "=================================="
echo ""

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未安裝 Node.js，請先安裝 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 檢查依賴
if [ ! -d "node_modules" ]; then
    echo "📦 首次執行，正在安裝依賴..."
    npm install
    echo ""
fi

# 打包程式碼
echo "🔨 正在打包程式碼..."
npm run build
echo ""

# 啟動伺服器
echo "🚀 啟動本地伺服器..."
echo "📍 請開啟瀏覽器訪問: http://localhost:8000"
echo "⏸️  按 Ctrl+C 停止伺服器"
echo ""
npm run serve
