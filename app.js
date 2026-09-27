const termInfo = {
  grid_z: ["起跑順位", "實際起跑順位增加 1 個標準差（約 5.85 位）。"],
  pace_delta_z: ["同場正賽圈速差", "個人有效圈速中位數減去同場中位數；增加 1 個標準差約等於慢 1.13 秒。"],
  pit_count_z: ["進站次數", "進站次數增加 1 個標準差（約 0.99 次）。"],
  pit_duration_z: ["平均進站時間", "平均進站時間增加 1 個標準差；使用原始資料中的進站時間定義。"],
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
function selectDriver(id) { selectedDriver=id; renderDriverDetail(); renderDrivers(); }

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
  const title=document.createElement("h3"); title.textContent=termInfo[c.term][0]; box.append(title);
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
    .on("click",(_,d)=>{selectedTerm=d.term;renderCoefficientDetail();renderCoefficients();})
    .on("keydown",(event,d)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();selectedTerm=d.term;renderCoefficientDetail();renderCoefficients();}})
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
function renderCoefficientTable(){const body=document.querySelector("#coefficient-table tbody");body.replaceChildren();dataset.coefficients.filter(d=>d.term!=="(Intercept)").forEach(d=>{const tr=document.createElement("tr");[termInfo[d.term][0],number(d.or),number(d.lower),number(d.upper),pvalue(d.p)].forEach(v=>addCell(tr,v));body.append(tr);});}
function renderFlow(){const holder=document.querySelector("#sample-flow");dataset.sample_flow.forEach(d=>{const item=document.createElement("div");item.className="flow-item";const label=document.createElement("span");label.textContent=flowNames[d.stage];const total=document.createElement("strong");total.textContent=fmt.format(d.observations);const track=document.createElement("div");track.className="flow-track";const fill=document.createElement("div");fill.className="flow-fill";fill.style.width=`${100*d.observations/dataset.sample_flow[0].observations}%`;track.append(fill);item.append(label,total,track);holder.append(item);});}
function renderDiagnostics(){const body=document.querySelector("#diagnostics-table tbody");body.replaceChildren();dataset.diagnostics.forEach(d=>{const tr=document.createElement("tr");const groups=d.groups.split(" | ").map(x=>groupNames[x]).join("、");[modelNames[d.model],groups,Number(d.aic).toFixed(2),d.singular?"是":"否"].forEach(v=>addCell(tr,v));body.append(tr);});}
function renderCoverage(){const holder=document.querySelector("#coverage-chart");holder.replaceChildren();const width=Math.max(560,holder.clientWidth||700),height=200,margin={top:15,right:10,bottom:30,left:28};const x=d3.scaleBand().domain(dataset.coverage.map(d=>d.year)).range([margin.left,width-margin.right]).padding(.28);const y=d3.scaleLinear().domain([0,26]).range([height-margin.bottom,margin.top]);const svg=d3.select(holder).append("svg").attr("viewBox",`0 0 ${width} ${height}`).attr("role","img").attr("aria-label","2018 至 2026 年收錄場數，2026 年目前為 15 場");svg.append("title").text("各年資料庫收錄比賽場數");svg.selectAll("rect").data(dataset.coverage).join("rect").attr("x",d=>x(d.year)).attr("y",d=>y(d.races)).attr("width",x.bandwidth()).attr("height",d=>y(0)-y(d.races)).attr("fill",d=>d.year===2026?"#bd4b40":"#2d637d");svg.selectAll("text.count").data(dataset.coverage).join("text").attr("class","count").attr("x",d=>x(d.year)+x.bandwidth()/2).attr("y",d=>y(d.races)-7).attr("text-anchor","middle").attr("font-family","IBM Plex Mono, monospace").attr("font-size",12).attr("fill","#182b35").text(d=>d.races);svg.append("g").attr("class","chart-axis").attr("transform",`translate(0,${height-margin.bottom})`).call(d3.axisBottom(x).tickSize(0));}
function renderCoverageTable(){const body=document.querySelector("#coverage-table tbody");body.replaceChildren();dataset.coverage.forEach(d=>{const tr=document.createElement("tr");[d.year,d.races,d.driver_races,d.fastf1_laps_available].forEach(v=>addCell(tr,v));body.append(tr);});}

async function start(){
  try{
    const response=await fetch("./data/results.json"); if(!response.ok)throw new Error(`HTTP ${response.status}`);
    dataset=await response.json();
    document.querySelector("#snapshot").textContent=`資料截至 ${dataset.meta.last_race_date} · ${fmt.format(dataset.meta.model_n)} 筆模型紀錄 · ${dataset.meta.model_races} 場比賽`;
    document.querySelectorAll('input[name="metric"]').forEach(input=>input.addEventListener("change",()=>{metric=input.value;renderDrivers();}));
    document.querySelector("#driver-search").addEventListener("input",renderDrivers);
    renderDriverDetail();renderDrivers();renderDriverTable();renderCoefficientDetail();renderCoefficients();renderCoefficientTable();renderFlow();renderDiagnostics();renderCoverage();renderCoverageTable();
    let timer;window.addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(()=>{renderDrivers();renderCoefficients();renderCoverage();},120);});
  }catch(error){document.querySelector("#snapshot").textContent="資料讀取失敗，請重新整理頁面。";console.error(error);}
}
start();
