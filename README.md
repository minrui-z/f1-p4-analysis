# F1 第四名資料分析

2018 年起 F1 正賽「恰好取得第四名」的互動結果頁。網站使用純 HTML、CSS、JavaScript 與 D3，透過 GitHub Pages 發布。

## 更新資料

網站收錄彙整結果及互動所需的 10 欄逐場摘要（車手、年份、場次、比賽名稱、日期、賽道代碼與名稱、車隊、起跑位置、最終名次）。`data/results.json` 由本機 F1 分析目錄的模型輸出、資料表與 `scripts/export_data.R` 產生；公開 repository 不含 111 欄逐筆正賽資料或模型 RDS。更新時須先重跑勒克萊爾比較和上游資料，再於該分析目錄執行：

```sh
Rscript scripts/audit_leclerc_p4.R
Rscript scripts/fit_leclerc_bayes.R
Rscript site/scripts/export_data.R
```

## 頁面

- `index.html`：白話結果、逐場軌跡、賽道紀錄、雙車手比較、車手與賽季圖。模型係數、檢定數字及診斷收在「詳細數字」內；名詞設有「？」註解。
- `limitations.html`：資料範圍、分析方法與解讀限制。

中文大標題使用 [源石黑體 GenSekiGothic TW](https://github.com/ButTaiwan/genseki-font) 的精簡網頁字型；字型依 [SIL Open Font License 1.1](assets/fonts/OFL-GenSekiGothic.txt) 發布。內文保留 Noto Sans TC。

選擇車手、年份、賽道、兩車比較或圖表指標時，網址會跟著更新；複製網址可保留目前的選擇。賽季圖可用 Tab 進入、方向鍵移動格子、Enter 選取車手。

## 檢查網站

```sh
npm ci
npx playwright install chromium
npm test
```

測試涵蓋首頁數字、320px 手機版面、鍵盤操作、可分享網址、瀏覽器返回、雙車手比較與主要頁面的無障礙檢查。GitHub Actions 會在推送及提交拉取請求時執行。

資料來源：[Jolpica](https://api.jolpi.ca/) 與 [FastF1](https://docs.fastf1.dev/)。2026 年資料為 2026-09-26 的快照。網站沒有追蹤器，也沒有後端服務。
