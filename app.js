const termInfo = {
  grid_z: ["起跑順位", "實際起跑順位增加 1 個標準差（約 5.85 位）。"],
  pace_delta_z: ["同場正賽圈速差", "個人有效圈速中位數減去同場中位數；增加 1 個標準差約等於慢 1.13 秒。"],
  pit_count_z: ["進站次數", "進站次數增加 1 個標準差（約 0.99 次）。"],
  pit_duration_z: ["平均進站時間", "平均進站時間增加 1 個標準差（約 263.61 秒）；使用原始資料中的進站時間定義。"],
  fastf1_starting_compoundINTERMEDIATE: ["起跑胎：半雨胎", "相對於硬胎。"],
  fastf1_starting_compoundMEDIUM: ["起跑胎：中性胎", "相對於硬胎。"],
  fastf1_starting_compoundSOFT: ["起跑胎：軟胎", "相對於硬胎。"],
  fastf1_starting_compoundSOFT_2018_VARIANT: ["起跑胎：2018 軟胎類", "合併 2018 年少見的 HYPERSOFT、SUPERSOFT 與 ULTRASOFT；相對於硬胎。"],
  fastf1_starting_compoundUNKNOWN: ["起跑胎：未明", "原始資料記為 nan 的起跑輪胎；相對於硬胎。"],
  fastf1_starting_compoundWET: ["起跑胎：全雨胎", "相對於硬胎。"],
  sc_messages_z: ["安全車訊息數", "該場安全車類別訊息數增加 1 個標準差（約 2.34 則）。"],
  rain: ["記錄到下雨", "記錄到下雨的賽事相對於未記錄到下雨的賽事。"]
};
const flowNames = {all_records:"原始車手正賽紀錄",exclude_non_starters:"排除未起跑者",complete_covariates:"保留模型變數完整紀錄",races_with_p4_retained:"保留第四名仍在樣本中的賽事"};
const modelNames = {baseline_initial:"簡單模型／原始群組",full_initial:"完整模型／原始群組",full_simplified_1:"完整模型／移除賽事",full_simplified_2:"最終完整模型",baseline_comparable:"簡單模型／相同群組"};
const groupNames = {driver_ref:"車手",team_season_id:"車隊×賽季",circuit_reference:"賽道",race_id:"賽事"};
const helpContent = {
  raw_vs_model:["這三種數字怎麼看？","次數和比例都是原始紀錄。「賽中模型估計」來自先前放入正賽圈速、進站等資料的模型；勒克萊爾的新比較請看下方「比較結果」。"],
  driver_metrics:["選哪個指標？","看總數選「第四名次數」，看每場起跑的比例選「起跑後比例」。「賽中模型估計」是先前模型的車手效果，和下方勒克萊爾的比較不是同一個數字。"],
  season_heatmap:["格子的顏色","一格是一位車手在某一年的第四名次數。越深代表越多；淺色代表有出賽但沒有第四名，灰色代表那年沒出賽。"],
  grid_rate:["圖上的百分比","例如某起跑位置有 100 次起跑，其中 10 次拿第四，圖上就是 10%。維修區起跑標為 0；第 21 位以後合在「21+」。"],
  finish_distribution:["名次怎麼分？","前五名各自列出；第 6 至 10 名和第 11 名以後各合成一組。退賽後若仍有官方名次，也照那個名次計算。"],
  glmm:["這是什麼模型？","模型看每筆結果是不是第四名，並容許同一位車手、同一年度車隊的紀錄比較相像。這次的主要模型只用起跑前已知的起跑位置來調整。"],
  ci:["橫線代表什麼？","圓點是算出來的勝算比，橫線是它的 95% 信賴區間。線越長，估計越不精確；橫線如果跨過 1，就不能明確說這項因素對應較高或較低的勝算。"],
  odds_ratio:["勝算比怎麼看？","1 代表兩邊的勝算相同；大於 1 代表第四名的勝算較高，小於 1 代表較低。像 0.35 是勝算變成原來的 0.35 倍，不是第四名機率直接少 65 個百分點。"],
  pvalue:["p 值怎麼看？","先假設兩邊其實沒有差異，再看目前這樣的資料有多罕見。數字越小，越難用「沒有差異」解釋；它不是「結論正確的機率」。"],
  is_p4:["第四名怎麼編碼？","官方最終名次是第 4 名就記 1；其他名次記 0。冠軍、亞軍、季軍也都算 0。這份資料的已起跑紀錄都有官方名次。"],
  complete_case:["先前模型用了哪些紀錄？","先拿掉沒起跑的紀錄，再拿掉圈速、進站等欄位有空白的紀錄，剩 3,475 筆。現在用來比較勒克萊爾的新模型有 3,772 筆已起跑紀錄。"],
  singular:["奇異擬合是什麼？","模型想替賽道和每場比賽分出額外差異，但兩者算出來都是 0。資料無法支持這兩項，所以最終模型把它們拿掉。"],
  random_intercept:["每個群組有自己的起點","模型讓不同車手、不同年度車隊有各自的基準值，再看勒克萊爾是否仍和其他車手不同。這樣能顧到同一個群組的紀錄可能比較像。"],
  aic:["AIC 怎麼看？","這是比較模型用的分數，同一批資料下通常越小越好。它同時考慮貼近資料的程度與模型複雜度，不是顯著性的 p 值。"],
  lrt:["追加檢驗在比什麼？","用同一批資料跑兩次：一次加入「是否為勒克萊爾」，一次不加。再看加入後，模型是否更能貼近觀察到的結果。"],
  nonstarter:["誰算未起跑？","資料標成 Did not start、Did not qualify 或 Did not prequalify 的紀錄會拿掉。已起跑但後來退賽者不會因退賽而直接排除。"],
  pace_recode:["圈速差怎麼算？","先取車手在該場的有效圈速中位數，再減掉同場車手的中位數。結果是正數，代表比同場的中間水準慢；之後再做標準化。"],
  zscore:["為什麼要標準化？","起跑順位用「位」、圈速用「秒」，不能直接拿數字大小互比。先減掉平均值，再除以標準差，就能用「比平均多一個標準差」來看各變數。"],
  tyre_recode:["起跑胎怎麼合併？","2018 年少見的 HYPERSOFT、SUPERSOFT、ULTRASOFT 合成一組；資料原本寫 nan 的列為「未知」。圖上的其他輪胎都拿硬胎來比較。"],
  rain_recode:["雨天怎麼記？","FastF1 只要在該場記錄到下雨，就記為 1；沒有記錄到下雨記為 0。原本沒資料的場次不會被當成無雨。"],
  group_recode:["群組怎麼放進模型？","車手、車隊×賽季、賽道和比賽原本都當成不同群組。賽道與比賽的額外差異算出來是 0，最終只保留前兩組。"],
  pit_duration:["平均進站時間","資料來自 Jolpica，以秒計。模型把它換成「比平均多幾個標準差」；在這批資料中，一個標準差約為 263.61 秒。"],
  safety_messages:["安全車訊息數","計算該場比賽中，FastF1 記錄了幾則安全車類別訊息。同一場的所有車手共用這個數字；一個標準差約為 2.34 則。"],
  comparison_scope:["兩種比較差在哪？","階層模型拿勒克萊爾跟所有其他車手比，也考慮起跑位置、車手和年度車隊。同場隊友比較只看他和當場隊友，兩人開的是同隊的車；兩種數字回答的問題不同。"],
  legacy_model:["這是先前的模型","這張圖用正賽圈速、進站、雨天等比賽中才知道的資料，樣本是 3,475 筆。它能描述賽中數字和第四名的關聯；這次勒克萊爾的主要比較另用 3,772 筆起跑紀錄重算。"],
  primary_sample:["為什麼這次是 3,772 筆？","原始有 3,788 筆，排除 16 筆沒起跑的紀錄。第四名、車手、起跑位置和車隊賽季都有值，所以不用再刪紀錄。"],
  grid_recode:["維修區起跑怎麼處理？","資料把維修區起跑記為 0，但這不是比第一名更前面。模型把它放在最後一格之後；起跑位置也不硬套一條直線，因為第 4、5 格拿第四的比例特別高。"]
};
const termHelp = {grid_z:"zscore",pace_delta_z:"pace_recode",pit_count_z:"zscore",pit_duration_z:"pit_duration",sc_messages_z:"safety_messages",rain:"rain_recode"};
const fmt = new Intl.NumberFormat("zh-TW");
const pct = x => `${(x * 100).toFixed(1)}%`;
const number = x => Number(x).toFixed(x >= 10 ? 1 : 2);
const pvalue = x => x < .001 ? "< 0.001" : Number(x).toFixed(3);
let dataset;
let metric = "p4";
let selectedDriver = "leclerc";
let selectedTerm = "pace_delta_z";
const tooltip = d3.select("body").append("div").attr("class", "chart-tooltip").style("display", "none");

function showTooltip(event, content) {
  tooltip.text(content).style("display", "block");
  moveTooltip(event);
}
function moveTooltip(event) {
  tooltip.style("left", `${Math.min(event.clientX + 12, window.innerWidth - 220)}px`)
    .style("top", `${Math.min(event.clientY + 12, window.innerHeight - 55)}px`);
}
function hideTooltip() { tooltip.style("display", "none"); }
function addCell(row, value, tag = "td") { const el = document.createElement(tag); el.textContent = value; row.append(el); }
let helpSource = null, helpPinned = false;
function closeHelp(){const popup=document.querySelector("#help-popover");popup.hidden=true;if(helpSource)helpSource.setAttribute("aria-expanded","false");helpSource=null;helpPinned=false;}
function openHelp(button,pinned=false){const content=helpContent[button.dataset.help];if(!content)return;const popup=document.querySelector("#help-popover");if(helpSource&&helpSource!==button)helpSource.setAttribute("aria-expanded","false");helpSource=button;helpPinned=pinned;popup.querySelector("strong").textContent=content[0];popup.querySelector("p").textContent=content[1];popup.hidden=false;button.setAttribute("aria-expanded","true");const box=button.getBoundingClientRect();const width=popup.offsetWidth;const left=Math.min(Math.max(12,box.left),window.innerWidth-width-12);const above=box.bottom+popup.offsetHeight+10>window.innerHeight;popup.style.left=`${left}px`;popup.style.top=`${above?Math.max(12,box.top-popup.offsetHeight-8):box.bottom+8}px`;}
function setupHelp(){document.addEventListener("pointerover",event=>{const button=event.target.closest?.("[data-help]");if(button&&!helpPinned)openHelp(button);});document.addEventListener("pointerout",event=>{const button=event.target.closest?.("[data-help]");if(button&&!button.contains(event.relatedTarget)&&!helpPinned)closeHelp();});document.addEventListener("focusin",event=>{const button=event.target.closest?.("[data-help]");if(button&&!helpPinned)openHelp(button);});document.addEventListener("focusout",event=>{const button=event.target.closest?.("[data-help]");if(button&&!helpPinned)closeHelp();});document.addEventListener("click",event=>{const button=event.target.closest?.("[data-help]");if(button){if(helpPinned&&helpSource===button)closeHelp();else openHelp(button,true);}else if(helpPinned&&!event.target.closest?.("#help-popover"))closeHelp();});document.addEventListener("keydown",event=>{if(event.key==="Escape")closeHelp();});window.addEventListener("scroll",()=>{if(!helpPinned&&helpSource)closeHelp();},{passive:true});}

function renderDriverDetail() {
  const d = dataset.drivers.find(x => x.id === selectedDriver) || dataset.drivers[0];
  const box = document.querySelector("#driver-detail");
  box.replaceChildren();
  const label = document.createElement("p"); label.className = "detail-label"; label.textContent = "目前選取"; box.append(label);
  const name = document.createElement("h3"); name.textContent = d.name; box.append(name);
  const grid = document.createElement("div"); grid.className = "detail-grid";
  [[d.p4, "次第四名"], [d.starts, "場起跑"], [pct(d.rate), "原始比例"], [number(Math.exp(d.driver_effect)), "先前賽中模型倍數"]].forEach(([v, title]) => {
    const item = document.createElement("div"); const strong = document.createElement("strong"); strong.textContent = v;
    const span = document.createElement("span"); span.textContent = title; item.append(strong, span); grid.append(item);
  });
  box.append(grid);
  const note = document.createElement("p"); note.textContent = `先前賽中模型樣本：${d.model_p4} 次第四名／${d.model_starts} 筆紀錄。`; box.append(note);
}
function metricValue(d) { return metric === "p4" ? d.p4 : metric === "rate" ? d.rate : Math.exp(d.driver_effect); }
function metricText(d) { return metric === "p4" ? `${d.p4} 次` : metric === "rate" ? pct(d.rate) : `${number(Math.exp(d.driver_effect))} 倍`; }
function renderDrivers() {
  const q = document.querySelector("#driver-search").value.trim().toLocaleLowerCase();
  const rows = dataset.drivers.filter(d => `${d.name} ${d.id}`.toLocaleLowerCase().includes(q))
    .sort((a,b) => metricValue(b) - metricValue(a) || a.name.localeCompare(b.name));
  const desc = {p4:"每位車手在所有已起跑正賽中的第四名次數。",rate:"第四名次數除以已起跑場數。",effect:"先前賽中模型的車手效果；垂直線代表該模型平均車手效果。"};
  document.querySelector("#driver-description").textContent = `${desc[metric]} 圖中可查看模型涵蓋的 44 位車手。`;
  const holder = document.querySelector("#driver-chart"); holder.replaceChildren();
  if (!rows.length) { const p = document.createElement("p"); p.style.padding = "25px"; p.textContent = "找不到符合的車手，請試試英文姓名。"; holder.append(p); return; }
  const containerWidth = holder.clientWidth || 750;
  const width = Math.max(630, containerWidth - 2);
  const margin = {left: 175,right: 78,top: 24,bottom: 32};
  const height = margin.top + rows.length * 38 + margin.bottom;
  const max = metric === "effect" ? Math.max(2, d3.max(rows, metricValue) * 1.13) : Math.max(1, d3.max(rows, metricValue) * 1.08);
  const x = d3.scaleLinear().domain([0,max]).range([margin.left,width-margin.right]);
  const svg = d3.select(holder).append("svg").attr("width",width).attr("height",height)
    .attr("role","img").attr("aria-label",`車手${metric === "p4" ? "第四名次數" : metric === "rate" ? "第四名比例" : "模型估計效果"}排行`);
  svg.append("title").text("車手第四名比較圖");
  if (metric === "effect") svg.append("line").attr("class","zero-line").attr("x1",x(1)).attr("x2",x(1)).attr("y1",margin.top-5).attr("y2",height-margin.bottom);
  const g = svg.selectAll("g.chart-row").data(rows,d=>d.id).join("g").attr("class",d=>`chart-row${d.id===selectedDriver?" selected":""}`)
    .attr("transform",(_,i)=>`translate(0,${margin.top+i*38})`).attr("tabindex",0).attr("role","button")
    .attr("aria-label",d=>`${d.name}，${metricText(d)}。按 Enter 查看紀錄。`)
    .on("click",(_,d)=>selectDriver(d.id)).on("keydown",(event,d)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();selectDriver(d.id);}})
    .on("pointerenter",(event,d)=>showTooltip(event,`${d.name}：${metricText(d)}`)).on("pointermove",moveTooltip).on("pointerleave",hideTooltip);
  g.append("rect").attr("class","row-bg").attr("x",0).attr("y",0).attr("width",width).attr("height",37).attr("fill","transparent");
  g.append("text").attr("x",16).attr("y",24).text(d=>d.name.length>24?`${d.name.slice(0,22)}…`:d.name);
  g.append("rect").attr("x",margin.left).attr("y",11).attr("height",16).attr("width",d=>Math.max(metricValue(d)===0?0:2,x(metricValue(d))-margin.left))
    .attr("fill",d=>d.id==="leclerc"?"#bd4b40":"#2d637d");
  g.append("text").attr("class","chart-value").attr("x",width-8).attr("y",24).attr("text-anchor","end").text(metricText);
  svg.append("g").attr("class","chart-axis").attr("transform",`translate(0,${height-margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(4).tickFormat(metric==="rate"?d3.format(".0%") : metric==="effect"?d3.format(".1f"):d3.format("d")));
}
function selectDriver(id,focusChart=true) { selectedDriver=id; renderDriverDetail(); renderDrivers(); renderFinishDistribution(); d3.selectAll("#season-chart .driver-label").style("fill",d=>d.id===id?"#bd4b40":"#182b35").style("font-weight",d=>d.id===id?700:500); if(focusChart)d3.selectAll("#driver-chart .chart-row").filter(d=>d.id===id).node()?.focus(); }

function renderDriverTable() {
  const body = document.querySelector("#driver-table tbody"); body.replaceChildren();
  dataset.drivers.toSorted((a,b)=>b.p4-a.p4||a.name.localeCompare(b.name)).forEach(d=>{
    const tr=document.createElement("tr"); [d.name,d.starts,d.p4,pct(d.rate),`${d.model_p4}／${d.model_starts}`,number(Math.exp(d.driver_effect))].forEach(v=>addCell(tr,v)); body.append(tr);
  });
}
function renderCoefficientDetail() {
  const c = dataset.coefficients.find(x=>x.term===selectedTerm);
  const box=document.querySelector("#coefficient-detail"); box.replaceChildren();
  const eyebrow=document.createElement("p"); eyebrow.className="detail-label"; eyebrow.textContent="目前選取的變數"; box.append(eyebrow);
  const title=document.createElement("h3"); title.textContent=termInfo[c.term][0];
  const help=document.createElement("button");help.type="button";help.className="help-button help-light";help.dataset.help=termHelp[c.term]||(c.term.startsWith("fastf1_starting_compound")?"tyre_recode":"zscore");help.setAttribute("aria-label",`說明${termInfo[c.term][0]}的變數處理`);help.textContent="?";title.append(" ",help);box.append(title);
  const big=document.createElement("p"); big.className="detail-big"; big.textContent=number(c.or); box.append(big);
  const meta=document.createElement("p"); meta.textContent=`勝算比，95% 信賴區間 ${number(c.lower)}–${number(c.upper)}；p ${pvalue(c.p)}`; box.append(meta);
  const note=document.createElement("p"); note.textContent=termInfo[c.term][1]; box.append(note);
}
function renderCoefficients() {
  const rows=dataset.coefficients.filter(d=>d.term!=="(Intercept)");
  const holder=document.querySelector("#coefficient-chart"); holder.replaceChildren();
  const width=Math.max(700,(holder.clientWidth||750)-2), height=rows.length*40+80;
  const margin={left:205,right:45,top:22,bottom:48};
  const lower=Math.min(.15,d3.min(rows,d=>d.lower)*.85),upper=Math.max(3,d3.max(rows,d=>d.upper)*1.1);
  const x=d3.scaleLog().domain([lower,upper]).range([margin.left,width-margin.right]);
  const svg=d3.select(holder).append("svg").attr("width",width).attr("height",height).attr("role","img").attr("aria-label","完整模型變數的勝算比與 95% 信賴區間");
  svg.append("title").text("模型係數圖：點為勝算比，線為 95% 信賴區間");
  svg.append("line").attr("class","zero-line").attr("x1",x(1)).attr("x2",x(1)).attr("y1",margin.top-10).attr("y2",height-margin.bottom);
  const g=svg.selectAll("g.chart-row").data(rows,d=>d.term).join("g")
    .attr("class",d=>`chart-row${d.term===selectedTerm?" selected":""}`)
    .attr("transform",(_,i)=>`translate(0,${margin.top+i*40})`).attr("tabindex",0).attr("role","button")
    .attr("aria-label",d=>`${termInfo[d.term][0]}，勝算比 ${number(d.or)}，按 Enter 查看詳細數字。`)
    .on("click",(_,d)=>selectTerm(d.term))
    .on("keydown",(event,d)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();selectTerm(d.term);}})
    .on("pointerenter",(event,d)=>showTooltip(event,`${termInfo[d.term][0]}：${number(d.or)}（${number(d.lower)}–${number(d.upper)}）`))
    .on("pointermove",moveTooltip).on("pointerleave",hideTooltip);
  g.append("rect").attr("class","row-bg").attr("width",width).attr("height",39).attr("fill","transparent");
  g.append("text").attr("x",15).attr("y",25).text(d=>termInfo[d.term][0]);
  g.append("line").attr("x1",d=>x(d.lower)).attr("x2",d=>x(d.upper)).attr("y1",20).attr("y2",20).attr("stroke",d=>d.term==="pace_delta_z"?"#bd4b40":"#2d637d").attr("stroke-width",2);
  g.append("line").attr("x1",d=>x(d.lower)).attr("x2",d=>x(d.lower)).attr("y1",14).attr("y2",26).attr("stroke","#2d637d");
  g.append("line").attr("x1",d=>x(d.upper)).attr("x2",d=>x(d.upper)).attr("y1",14).attr("y2",26).attr("stroke","#2d637d");
  g.append("circle").attr("cx",d=>x(d.or)).attr("cy",20).attr("r",5).attr("fill",d=>d.term==="pace_delta_z"?"#bd4b40":"#2d637d");
  svg.append("g").attr("class","chart-axis").attr("transform",`translate(0,${height-margin.bottom})`)
    .call(d3.axisBottom(x).tickValues([.1,.2,.5,1,2,5,10].filter(v=>v>=lower&&v<=upper)).tickFormat(d3.format("~g")));
  svg.append("text").attr("x",(margin.left+width-margin.right)/2).attr("y",height-8).attr("text-anchor","middle")
    .attr("fill","#5f7279").attr("font-size",11).text("取得第四名的勝算比（對數刻度）");
}
function selectTerm(term) { selectedTerm=term; renderCoefficientDetail(); renderCoefficients(); d3.selectAll("#coefficient-chart .chart-row").filter(d=>d.term===term).node()?.focus(); }
function renderCoefficientTable(){const body=document.querySelector("#coefficient-table tbody");body.replaceChildren();dataset.coefficients.filter(d=>d.term!=="(Intercept)").forEach(d=>{const tr=document.createElement("tr");[termInfo[d.term][0],number(d.or),number(d.lower),number(d.upper),pvalue(d.p)].forEach(v=>addCell(tr,v));body.append(tr);});}
function renderFlow(){const holder=document.querySelector("#sample-flow");dataset.sample_flow.forEach(d=>{const item=document.createElement("div");item.className="flow-item";const label=document.createElement("span");label.textContent=flowNames[d.stage];const total=document.createElement("strong");total.textContent=fmt.format(d.observations);const track=document.createElement("div");track.className="flow-track";const fill=document.createElement("div");fill.className="flow-fill";fill.style.width=`${100*d.observations/dataset.sample_flow[0].observations}%`;track.append(fill);item.append(label,total,track);holder.append(item);});}
function renderDiagnostics(){const body=document.querySelector("#diagnostics-table tbody");body.replaceChildren();dataset.diagnostics.forEach(d=>{const tr=document.createElement("tr");const groups=d.groups.split(" | ").map(x=>groupNames[x]).join("、");[modelNames[d.model],groups,Number(d.aic).toFixed(2),d.singular?"是":"否"].forEach(v=>addCell(tr,v));body.append(tr);});}
function renderCoverage(){const holder=document.querySelector("#coverage-chart");holder.replaceChildren();const width=Math.max(560,holder.clientWidth||700),height=200,margin={top:15,right:10,bottom:30,left:28};const x=d3.scaleBand().domain(dataset.coverage.map(d=>d.year)).range([margin.left,width-margin.right]).padding(.28);const y=d3.scaleLinear().domain([0,26]).range([height-margin.bottom,margin.top]);const svg=d3.select(holder).append("svg").attr("viewBox",`0 0 ${width} ${height}`).attr("role","img").attr("aria-label","2018 至 2026 年收錄場數，2026 年目前為 15 場");svg.append("title").text("各年資料庫收錄比賽場數");svg.selectAll("rect").data(dataset.coverage).join("rect").attr("x",d=>x(d.year)).attr("y",d=>y(d.races)).attr("width",x.bandwidth()).attr("height",d=>y(0)-y(d.races)).attr("fill",d=>d.year===2026?"#bd4b40":"#2d637d");svg.selectAll("text.count").data(dataset.coverage).join("text").attr("class","count").attr("x",d=>x(d.year)+x.bandwidth()/2).attr("y",d=>y(d.races)-7).attr("text-anchor","middle").attr("font-family","IBM Plex Mono, monospace").attr("font-size",12).attr("fill","#182b35").text(d=>d.races);svg.append("g").attr("class","chart-axis").attr("transform",`translate(0,${height-margin.bottom})`).call(d3.axisBottom(x).tickSize(0));}
function renderCoverageTable(){const body=document.querySelector("#coverage-table tbody");body.replaceChildren();dataset.coverage.forEach(d=>{const tr=document.createElement("tr");[d.year,d.races,d.driver_races,d.fastf1_laps_available].forEach(v=>addCell(tr,v));body.append(tr);});}

function topSeasonDrivers(){return dataset.drivers.toSorted((a,b)=>b.p4-a.p4||a.name.localeCompare(b.name)).slice(0,12);}
function renderSeason(){
  const holder=document.querySelector("#season-chart");holder.replaceChildren();
  const top=topSeasonDrivers(), years=dataset.coverage.map(d=>d.year), lookup=new Map(dataset.driver_year.map(d=>[`${d.id}-${d.year}`,d]));
  const width=Math.max(780,holder.clientWidth||900), rowHeight=39, height=top.length*rowHeight+70;
  const x=d3.scaleBand().domain(years).range([190,width-22]).padding(.08), y=d3.scaleBand().domain(top.map(d=>d.id)).range([45,height-25]).padding(.08);
  const svg=d3.select(holder).append("svg").attr("class","heat-svg").attr("width",width).attr("height",height).attr("role","img").attr("aria-label","第四名總次數前 12 位車手的各年第四名次數");
  svg.append("title").text("車手與賽季第四名熱圖");
  svg.selectAll("text.year").data(years).join("text").attr("class","year").attr("x",d=>x(d)+x.bandwidth()/2).attr("y",30).attr("text-anchor","middle").attr("font-family","IBM Plex Mono, monospace").text(String);
  const labels=svg.selectAll("text.driver-label").data(top).join("text").attr("class","driver-label").attr("x",16).attr("y",d=>y(d.id)+y.bandwidth()/2+4).attr("tabindex",0).attr("role","button").attr("aria-label",d=>`選取 ${d.name}`)
    .style("fill",d=>d.id===selectedDriver?"#bd4b40":"#182b35").style("font-weight",d=>d.id===selectedDriver?700:500).style("cursor","pointer").text(d=>d.name)
    .on("click",(_,d)=>selectDriver(d.id,false)).on("keydown",(event,d)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();selectDriver(d.id,false);}});
  const cells=top.flatMap(driver=>years.map(year=>({driver,year,...lookup.get(`${driver.id}-${year}`)})));
  const color=d=>d.starts===0?"#e2e8e5":d.p4===0?"#eef3f2":d.p4===1?"#a7c5ca":d.p4===2?"#6d9ba6":d.p4===3?"#2d637d":"#bd4b40";
  const g=svg.selectAll("g.heat-cell").data(cells).join("g").attr("class","heat-cell").attr("tabindex",0).attr("role","img")
    .attr("aria-label",d=>`${d.driver.name}，${d.year} 年，${d.starts===0?"未出賽":`${d.p4} 次第四名，${d.starts} 場起跑`}`)
    .on("pointerenter",(event,d)=>showTooltip(event,`${d.driver.name} · ${d.year}：${d.starts===0?"未出賽":`${d.p4} 次第四名／${d.starts} 場起跑`}`))
    .on("pointermove",moveTooltip).on("pointerleave",hideTooltip).on("click",(_,d)=>selectDriver(d.driver.id,false));
  g.append("rect").attr("x",d=>x(d.year)).attr("y",d=>y(d.driver.id)).attr("width",x.bandwidth()).attr("height",y.bandwidth()).attr("fill",color);
  g.filter(d=>d.p4>0).append("text").attr("x",d=>x(d.year)+x.bandwidth()/2).attr("y",d=>y(d.driver.id)+y.bandwidth()/2+5).attr("text-anchor","middle").style("fill",d=>d.p4>=3?"#fff":"#182b35").text(d=>d.p4);
  return labels;
}
function renderSeasonTable(){const table=document.querySelector("#season-table"),head=table.querySelector("thead tr"),body=table.querySelector("tbody");head.querySelectorAll("th:not(:first-child)").forEach(x=>x.remove());body.replaceChildren();const years=dataset.coverage.map(d=>d.year),lookup=new Map(dataset.driver_year.map(d=>[`${d.id}-${d.year}`,d]));years.forEach(year=>addCell(head,year,"th"));topSeasonDrivers().forEach(driver=>{const tr=document.createElement("tr");addCell(tr,driver.name,"th");years.forEach(year=>{const d=lookup.get(`${driver.id}-${year}`);addCell(tr,d.starts?d.p4:"—");});body.append(tr);});}
function gridLabel(group){return group==="pitlane"?"維修區":group==="21plus"?"21+":group;}
function renderGrid(){const holder=document.querySelector("#grid-chart");holder.replaceChildren();const rows=dataset.grid,width=Math.max(520,holder.clientWidth||520),height=285,margin={left:45,right:20,top:20,bottom:48};const x=d3.scalePoint().domain(rows.map(d=>d.group)).range([margin.left,width-margin.right]).padding(.55);const ymax=Math.max(.2,d3.max(rows,d=>d.rate)*1.16),y=d3.scaleLinear().domain([0,ymax]).range([height-margin.bottom,margin.top]);const svg=d3.select(holder).append("svg").attr("width",width).attr("height",height).attr("role","img").attr("aria-label","各起跑位置拿第四名的比例");svg.append("title").text("起跑位置與第四名比例");svg.append("g").attr("class","chart-axis").attr("transform",`translate(0,${height-margin.bottom})`).call(d3.axisBottom(x).tickValues(["pitlane",...Array.from({length:10},(_,i)=>String((i+1)*2)),"21plus"]).tickFormat(gridLabel));svg.append("g").attr("class","chart-axis").attr("transform",`translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")));svg.selectAll("line.stem").data(rows).join("line").attr("class","stem").attr("x1",d=>x(d.group)).attr("x2",d=>x(d.group)).attr("y1",y(0)).attr("y2",d=>y(d.rate)).attr("stroke","#9db8bd").attr("stroke-width",2);svg.selectAll("circle.dot").data(rows).join("circle").attr("class","dot").attr("cx",d=>x(d.group)).attr("cy",d=>y(d.rate)).attr("r",6).attr("fill","#2d637d").attr("tabindex",0).attr("role","img").attr("aria-label",d=>`${gridLabel(d.group)}起跑，${d.p4} 次第四名，共 ${d.starts} 次起跑，比例 ${pct(d.rate)}`).on("pointerenter",(event,d)=>showTooltip(event,`${gridLabel(d.group)}起跑：${d.p4}／${d.starts}，${pct(d.rate)}`)).on("pointermove",moveTooltip).on("pointerleave",hideTooltip);}
function renderGridTable(){const body=document.querySelector("#grid-table tbody");body.replaceChildren();dataset.grid.forEach(d=>{const tr=document.createElement("tr");[gridLabel(d.group),d.starts,d.p4,pct(d.rate)].forEach(v=>addCell(tr,v));body.append(tr);});}
const finishLabels={p1:"冠軍",p2:"第 2 名",p3:"第 3 名",p4:"第 4 名",p5:"第 5 名",p6_10:"第 6–10 名",p11plus:"第 11 名後",no_position:"無官方名次"};
function renderFinishDistribution(){const driver=dataset.drivers.find(d=>d.id===selectedDriver);document.querySelector("#finish-driver-name").textContent=driver.name;const rows=dataset.finish_distribution.filter(d=>d.id===selectedDriver);const holder=document.querySelector("#finish-chart");holder.replaceChildren();const width=Math.max(460,holder.clientWidth||460),height=rows.length*37+38,margin={left:105,right:37,top:8,bottom:28};const x=d3.scaleLinear().domain([0,Math.max(1,d3.max(rows,d=>d.count)*1.12)]).range([margin.left,width-margin.right]);const svg=d3.select(holder).append("svg").attr("width",width).attr("height",height).attr("role","img").attr("aria-label",`${driver.name} 各名次場數`);svg.append("title").text(`${driver.name} 官方名次分布`);const g=svg.selectAll("g.finish-row").data(rows).join("g").attr("class","finish-row").attr("transform",(_,i)=>`translate(0,${margin.top+i*37})`);g.append("text").attr("x",6).attr("y",24).text(d=>finishLabels[d.bucket]);g.append("rect").attr("x",margin.left).attr("y",10).attr("height",19).attr("width",d=>x(d.count)-margin.left).attr("fill",d=>d.bucket==="p4"?"#bd4b40":"#2d637d");g.append("text").attr("x",d=>x(d.count)+6).attr("y",25).attr("font-family","IBM Plex Mono, monospace").text(d=>d.count);svg.append("g").attr("class","chart-axis").attr("transform",`translate(0,${height-margin.bottom})`).call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")));}

const auditNames={hierarchical_all_starters:"階層模型：全部車手",same_race_teammate:"同場隊友",same_team_season:"同車隊同賽季",hierarchical_2019_2025:"階層模型：2019–2025",same_race_teammate_2019_2025:"同場隊友：2019–2025"};
function renderLeclercComparison(){
  const holder=document.querySelector("#leclerc-comparison-chart");holder.replaceChildren();
  const rows=dataset.leclerc_audit.slice(0,3),width=Math.max(690,(holder.clientWidth||760)-2),height=230;
  const x=d3.scaleLog().domain([.5,16]).range([190,width-145]);
  const svg=d3.select(holder).append("svg").attr("width",width).attr("height",height).attr("role","img").attr("aria-label","勒克萊爾三種比較的勝算比與 95% 信賴區間");
  svg.append("title").text("圓點是勝算比；橫線是 95% 信賴區間；直線是勝算比 1");
  svg.append("line").attr("class","zero-line").attr("x1",x(1)).attr("x2",x(1)).attr("y1",19).attr("y2",185);
  const g=svg.selectAll("g.comparison-row").data(rows).join("g").attr("class","comparison-row").attr("transform",(_,i)=>`translate(0,${48+i*56})`);
  g.append("text").attr("class","comparison-label").attr("x",18).attr("y",5).text(d=>auditNames[d.comparison]);
  g.append("line").attr("x1",d=>x(d.ci_low)).attr("x2",d=>x(d.ci_high)).attr("y1",0).attr("y2",0).attr("stroke","#2d637d").attr("stroke-width",3);
  g.append("circle").attr("cx",d=>x(d.odds_ratio)).attr("cy",0).attr("r",7).attr("fill","#bd4b40")
    .attr("tabindex",0).attr("role","img")
    .attr("aria-label",d=>`${auditNames[d.comparison]}：勝算比 ${number(d.odds_ratio)}，95% 信賴區間 ${number(d.ci_low)} 到 ${number(d.ci_high)}，p ${pvalue(d.p_lrt??d.p_wald)}`)
    .on("pointerenter",(event,d)=>showTooltip(event,`${auditNames[d.comparison]}：${number(d.odds_ratio)}（${number(d.ci_low)}–${number(d.ci_high)}）`)).on("pointermove",moveTooltip).on("pointerleave",hideTooltip);
  g.append("text").attr("class","comparison-value").attr("x",width-130).attr("y",5).text(d=>`${number(d.odds_ratio)} · p ${pvalue(d.p_lrt??d.p_wald)}`);
  svg.append("g").attr("class","chart-axis").attr("transform","translate(0,205)").call(d3.axisBottom(x).tickValues([.5,1,2,4,8,16]).tickFormat(d3.format("~g")));
}
function renderLeclercComparisonTable(){
  const body=document.querySelector("#leclerc-comparison-table tbody");body.replaceChildren();
  dataset.leclerc_audit.forEach(d=>{const row=document.createElement("tr");[auditNames[d.comparison],number(d.odds_ratio),number(d.ci_low),number(d.ci_high),pvalue(d.p_lrt??d.p_wald)].forEach(value=>addCell(row,value));body.append(row);});
}

async function start(){
  setupHelp();
  try{
    const response=await fetch("./data/results.json"); if(!response.ok)throw new Error(`HTTP ${response.status}`);
    dataset=await response.json();
    document.querySelector("#snapshot").textContent=`資料截至 ${dataset.meta.last_race_date} · ${fmt.format(dataset.meta.starts)} 筆已起跑紀錄 · ${dataset.meta.races} 場比賽`;
    document.querySelectorAll('input[name="metric"]').forEach(input=>input.addEventListener("change",()=>{metric=input.value;renderDrivers();}));
    document.querySelector("#driver-search").addEventListener("input",renderDrivers);
    renderDriverDetail();renderDrivers();renderDriverTable();renderSeason();renderSeasonTable();renderGrid();renderGridTable();renderFinishDistribution();renderLeclercComparison();renderLeclercComparisonTable();renderCoefficientDetail();renderCoefficients();renderCoefficientTable();renderFlow();renderDiagnostics();renderCoverage();renderCoverageTable();
    let timer;window.addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(()=>{renderDrivers();renderSeason();renderGrid();renderFinishDistribution();renderLeclercComparison();renderCoefficients();renderCoverage();},120);});
  }catch(error){document.querySelector("#snapshot").textContent="資料讀取失敗，請重新整理頁面。";console.error(error);}
}
start();
