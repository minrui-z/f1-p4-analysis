# F1 第四名資料分析

2018 年起 F1 正賽「恰好取得第四名」的互動結果頁。網站使用純 HTML、CSS、JavaScript 與 D3，透過 GitHub Pages 發布。

## 更新資料

網站只收錄彙整結果。`data/results.json` 由本機 F1 分析目錄的模型輸出、資料表與 `scripts/export_data.R` 產生；公開 repository 不含 111 欄逐筆正賽資料或模型 RDS。更新時須先重跑勒克萊爾比較和上游資料，再於該分析目錄執行：

```sh
Rscript scripts/audit_leclerc_p4.R
Rscript site/scripts/export_data.R
```

## 頁面

- `index.html`：車手比較、賽季熱圖、起跑位置與名次分布、勒克萊爾的階層模型及同場隊友比較，以及先前賽中模型的係數與診斷。統計名詞和重編碼設有「？」註解。
- `limitations.html`：資料範圍、分析方法與解讀限制。

資料來源：[Jolpica](https://api.jolpi.ca/) 與 [FastF1](https://docs.fastf1.dev/)。2026 年資料為 2026-09-26 的快照。網站沒有追蹤器，也沒有後端服務。
