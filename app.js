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
  raw_vs_model:["三種車手數字","次數是實際拿到第四名的場數；比例是次數除以起跑場數；模型估計則是在納入其他變數後，車手隨機截距換算的勝算倍數。"],
  driver_metrics:["車手比較指標","「第四名次數」看總量；「起跑後比例」看每場起跑的比例；「模型估計」以平均車手效果為 1，比較模型內的車手效果。"],
  season_heatmap:["賽季熱圖","每格是某位車手在該年所有已起跑正賽中的第四名次數；灰格代表該年沒有起跑紀錄，淺色有出賽但沒有第四名。按車手名稱可選取該車手。"],
  grid_rate:["起跑位置的第四名比例","分子是從該位置起跑後取得第四名的次數，分母是從該位置起跑的所有車手紀錄。0 代表維修區起跑；21+ 合併較後面的起跑位置。"],
  finish_distribution:["官方名次分布","將所選車手的官方最終名次分成第 1 至 5 名、第 6 至 10 名、第 11 名以後及沒有名次。退賽者若仍有官方名次，也依該名次列入。"],
  glmm:["階層邏輯斯迴歸","結果只有第四名／不是第四名兩類，模型用 logit 連結估計勝算。車手及車隊×賽季各有一個隨機截距，用來表示群組間的基準差異。"],
  ci:["95% 信賴區間","圖上的橫線是由係數估計值與標準誤計算的 Wald 95% 區間；點是勝算比估計值。區間跨過 1，代表這個單一係數的區間包含無差異值。"],
  odds_ratio:["勝算比","勝算是機率除以「1 減機率」。勝算比 1 代表相同；0.35 代表勝算約為比較基準的 35%，不是機率直接少 65 個百分點。"],
  pvalue:["p 值","假設該效果為零時，得到目前或更極端檢定統計量的機率。網站用 0.05 作為常見的比較門檻；p 值不是假說為真的機率。"],
  is_p4:["第四名依變數","以官方 finish_position 為準：等於 4 編為 1，其他名次編為 0。缺少名次者不滿足完整個案條件。第 1 至 3 名也編為 0。"],
  complete_case:["完整個案","先排除未起跑者，再保留模型所需欄位都有值的紀錄；最後只留下第四名車手仍在樣本中的賽事。最後有 3,475 筆、184 場。"],
  singular:["奇異擬合","模型將某些隨機效果變異估為零，表示目前資料無法把這些群組的額外差異穩定分開。原始模型的賽事與賽道效果為零，最終模型已移除。"],
  random_intercept:["隨機截距","讓同一車手或同一車隊賽季共享一個基準偏移量。原本也測試賽道與賽事，最終保留車手和車隊×賽季。"],
  aic:["AIC","綜合模型擬合程度與參數數量的指標。在同一批資料上比較時，數值較小的模型通常較受支持；它不是 p 值。"],
  lrt:["概似比檢定","比較「有勒克萊爾指標」與「沒有該指標」兩個模型的配適程度；兩個模型使用同一份樣本。"],
  nonstarter:["未起跑者篩選","race_status 是 Did not start、Did not qualify、Did not prequalify 的紀錄被排除。已起跑後退賽者沒有被一律排除。"],
  pace_recode:["同場圈速差","每位車手的 FastF1 有效圈速中位數，減去該場所有可用車手的圈速中位數。正值代表比同場中位數慢；再用完整模型樣本標準化。"],
  zscore:["標準化","對起跑順位、同場圈速差、進站次數、平均進站時間與安全車訊息數，各自減去完整模型樣本平均，再除以樣本標準差。係數表示增加 1 個標準差。"],
  tyre_recode:["起跑輪胎重編碼","2018 年的 HYPERSOFT、SUPERSOFT、ULTRASOFT 合為 SOFT_2018_VARIANT；原始字串 nan 記為 UNKNOWN。硬胎 HARD 是模型參照組。"],
  rain_recode:["雨天變數","weather_any_rain 的 True 編為 1，False 編為 0，表示 FastF1 在該場是否記錄到下雨。來源缺值不會被編成無雨。"],
  group_recode:["群組變數","車手、車隊×賽季、賽道與賽事 ID 都轉成類別群組，用於隨機截距。最終模型因零變異移除賽道與賽事。"],
  pit_duration:["平均進站時間","Jolpica 的 pit_duration_mean_seconds，單位秒。模型先用完整個案樣本的平均與標準差轉換；1 個標準差約 263.61 秒。"],
  safety_messages:["安全車訊息數","FastF1 賽會訊息中屬於 SafetyCar 類別的筆數，同一場的車手共享該場數值；1 個標準差約 2.34 則。"]
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
  [[d.p4, "次第四名"], [d.starts, "場起跑"], [pct(d.rate), "原始比例"], [number(Math.exp(d.driver_effect)), "模型估計倍數"]].forEach(([v, title]) => {
    const item = document.createElement("div"); const strong = document.createElement("strong"); strong.textContent = v;
    const span = document.createElement("span"); span.textContent = title; item.append(strong, span); grid.append(item);
  });
  box.append(grid);
  const note = document.createElement("p"); note.textContent = `完整模型樣本：${d.model_p4} 次第四名／${d.model_starts} 筆紀錄。`; box.append(note);
}
function metricValue(d) { return metric === "p4" ? d.p4 : metric === "rate" ? d.rate : Math.exp(d.driver_effect); }
function metricText(d) { return metric === "p4" ? `${d.p4} 次` : metric === "rate" ? pct(d.rate) : `${number(Math.exp(d.driver_effect))} 倍`; }
function renderDrivers() {
  const q = document.querySelector("#driver-search").value.trim().toLocaleLowerCase();
  const rows = dataset.drivers.filter(d => `${d.name} ${d.id}`.toLocaleLowerCase().includes(q))
    .sort((a,b) => metricValue(b) - metricValue(a) || a.name.localeCompare(b.name));
  const desc = {p4:"每位車手在所有已起跑正賽中的第四名次數。",rate:"第四名次數除以已起跑場數。",effect:"車手隨機效果換算的勝算倍數；垂直線代表模型平均車手效果。"};
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

async function start(){
  setupHelp();
  try{
    const response=await fetch("./data/results.json"); if(!response.ok)throw new Error(`HTTP ${response.status}`);
    dataset=await response.json();
    document.querySelector("#snapshot").textContent=`資料截至 ${dataset.meta.last_race_date} · ${fmt.format(dataset.meta.model_n)} 筆模型紀錄 · ${dataset.meta.model_races} 場比賽`;
    document.querySelectorAll('input[name="metric"]').forEach(input=>input.addEventListener("change",()=>{metric=input.value;renderDrivers();}));
    document.querySelector("#driver-search").addEventListener("input",renderDrivers);
    renderDriverDetail();renderDrivers();renderDriverTable();renderSeason();renderSeasonTable();renderGrid();renderGridTable();renderFinishDistribution();renderCoefficientDetail();renderCoefficients();renderCoefficientTable();renderFlow();renderDiagnostics();renderCoverage();renderCoverageTable();
    let timer;window.addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(()=>{renderDrivers();renderSeason();renderGrid();renderFinishDistribution();renderCoefficients();renderCoverage();},120);});
  }catch(error){document.querySelector("#snapshot").textContent="資料讀取失敗，請重新整理頁面。";console.error(error);}
}
start();
