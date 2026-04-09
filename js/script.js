// script.js — all chart logic, loads data from CSV at runtime

const CSV_PATH = "data/OECD.ENV.EPI,DSD_AIR_GHG@DF_AIR_GHG,+.A.GHG._T.KG_CO2E_PS.csv";

// Countries to highlight in the white hat line chart
const LINE_COUNTRIES = ["Australia", "Canada", "Germany", "France", "United Kingdom", "Sweden", "Japan"];

// Countries for black hat charts (cherry-picked low emitters, 2018-2023 only)
const BH_BAR_COUNTRIES  = ["Sweden", "Malta", "Switzerland", "Portugal", "Latvia", "Hungary", "United Kingdom", "France"];
const BH_LINE_COUNTRIES = ["France", "United Kingdom", "Sweden", "Portugal"];

const LINE_COLORS = {
  "Australia":      "#e07b39",
  "Canada":         "#c0392b",
  "Germany":        "#2c3e50",
  "France":         "#2980b9",
  "United Kingdom": "#16a085",
  "Sweden":         "#27ae60",
  "Japan":          "#d35400"
};
const BH_COLORS = {
  "France": "#e67e22", "United Kingdom": "#e74c3c",
  "Sweden": "#9b59b6", "Portugal": "#c0392b"
};

// This is the tooltip
const tip = document.getElementById("tooltip");
function showTip(html, evt) { tip.innerHTML = html; tip.style.opacity = 1; moveTip(evt); }
function moveTip(evt) { tip.style.left = (evt.clientX + 14) + "px"; tip.style.top = (evt.clientY - 10) + "px"; }
function hideTip() { tip.style.opacity = 0; }

// Helps makes the SVG
function makeSvg(id, vw, vh, m) {
  const g = d3.select("#" + id).append("svg")
    .attr("viewBox", `0 0 ${vw} ${vh}`)
    .style("width", "100%").style("display", "block")
    .append("g").attr("transform", `translate(${m.l},${m.t})`);
  return { g, W: vw - m.l - m.r, H: vh - m.t - m.b };
}

function gridlines(g, axFn, len) {
  g.append("g").call(axFn.tickSize(-len).tickFormat(""))
   .call(gr => { gr.select(".domain").remove(); gr.selectAll("line").attr("stroke","#e0ddd8").attr("stroke-dasharray","3,3"); });
}

// The white hat bar chart
function drawWhiteBar(data2023) {
  const sorted = [...data2023].sort((a, b) => b.value - a.value);
  const { g, W, H } = makeSvg("white-bar", 960, 420, { l:66, r:20, t:24, b:128 });

  const x = d3.scaleBand().domain(sorted.map(d => d.country)).range([0, W]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(sorted, d => d.value) * 1.08]).range([H, 0]);
  const colFn = v => d3.interpolateRdYlGn(1 - v / d3.max(sorted, d => d.value));

  gridlines(g, d3.axisLeft(y).ticks(6), W);

  g.selectAll("rect").data(sorted).enter().append("rect")
    .attr("x", d => x(d.country)).attr("y", d => y(d.value))
    .attr("width", x.bandwidth()).attr("height", d => H - y(d.value))
    .attr("fill", d => colFn(d.value)).attr("rx", 1)
    .on("mousemove", (evt, d) => showTip(`<b>${d.country}</b><br>${d.value.toFixed(2)} kg CO₂e/person`, evt))
    .on("mouseleave", hideTip);

  // The OECD avg line
  const avg = d3.mean(sorted, d => d.value);
  g.append("line").attr("x1",0).attr("x2",W).attr("y1",y(avg)).attr("y2",y(avg))
    .attr("stroke","#2c3e50").attr("stroke-dasharray","6,3").attr("stroke-width",1.5);
  g.append("text").attr("x", W-4).attr("y", y(avg)-5).attr("text-anchor","end")
    .style("font-size","10px").style("fill","#2c3e50")
    .text("Average: " + avg.toFixed(2) + " kg");

  g.append("g").attr("transform",`translate(0,${H})`).call(d3.axisBottom(x))
    .call(ax => { ax.select(".domain").attr("stroke","#bbb");
      ax.selectAll("text").attr("transform","rotate(-45)").attr("text-anchor","end")
        .attr("dx","-0.5em").attr("dy","0.15em").style("font-size","9px").style("fill","#444"); });

  g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d => d + " kg"))
    .call(ax => { ax.select(".domain").remove(); ax.selectAll("text").style("font-size","10px").style("fill","#555"); });

  g.append("text").attr("transform","rotate(-90)").attr("x",-H/2).attr("y",-52)
    .attr("text-anchor","middle").style("font-size","10px").style("fill","#777")
    .text("kg CO₂-equivalent per person (2023)");
}

// The white hat line chart
function drawWhiteLine(allRows) {
  const { g, W, H } = makeSvg("white-line", 900, 360, { l:68, r:145, t:20, b:50 });

  const years = [...new Set(allRows.map(d => d.year))].sort();
  const x = d3.scaleLinear().domain(d3.extent(years)).range([0, W]);
  const y = d3.scaleLinear().domain([0, d3.max(allRows, d => d.value) * 1.08]).range([H, 0]);

  gridlines(g, d3.axisLeft(y).ticks(6), W);

  const lineGen = d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);

  LINE_COUNTRIES.forEach(country => {
    const pts = allRows.filter(d => d.country === country).sort((a,b) => a.year - b.year);
    if (!pts.length) return;
    const col = LINE_COLORS[country] || "#888";

    g.append("path").datum(pts).attr("fill","none").attr("stroke",col).attr("stroke-width",2.2).attr("d",lineGen);

    g.selectAll(null).data(pts).enter().append("circle")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d.value))
      .attr("r", 3).attr("fill", col)
      .on("mousemove", (evt,d) => showTip(`<b>${country}</b><br>${d.year}: ${d.value.toFixed(2)} kg CO₂e`, evt))
      .on("mouseleave", hideTip);

    const last = pts[pts.length - 1];
    g.append("text").attr("x", x(last.year)+7).attr("y", y(last.value)+4)
      .style("font-size","10px").style("fill",col).style("font-weight","600").text(country);
  });

  g.append("g").attr("transform",`translate(0,${H})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(years.length))
    .call(ax => { ax.select(".domain").attr("stroke","#bbb"); ax.selectAll("text").style("font-size","10px").style("fill","#555"); });

  g.append("g").call(d3.axisLeft(y).ticks(6).tickFormat(d => d + " kg"))
    .call(ax => { ax.select(".domain").remove(); ax.selectAll("text").style("font-size","10px").style("fill","#555"); });

  g.append("text").attr("transform","rotate(-90)").attr("x",-H/2).attr("y",-54)
    .attr("text-anchor","middle").style("font-size","10px").style("fill","#777")
    .text("kg CO₂-equivalent per person");
}

// The black hat line chart
function drawBlackBar(data2023) {
  // Cherry-pick only the low emitters
  const filtered = data2023
    .filter(d => BH_BAR_COUNTRIES.includes(d.country))
    .sort((a, b) => a.value - b.value);

  const { g, W, H } = makeSvg("black-bar", 640, 340, { l:74, r:20, t:36, b:72 });

  const x = d3.scaleBand().domain(filtered.map(d => d.country)).range([0, W]).padding(0.28);
  // Truncated axis which does not start at 0
  const yMin = d3.min(filtered, d => d.value) * 0.88;
  const y = d3.scaleLinear().domain([yMin, d3.max(filtered, d => d.value) * 1.04]).range([H, 0]);

  const alarmColor = d3.scaleSequential(d3.interpolateYlOrRd).domain([yMin, d3.max(filtered, d => d.value)]);

  gridlines(g, d3.axisLeft(y).ticks(5), W);

  g.selectAll("rect").data(filtered).enter().append("rect")
    .attr("x", d => x(d.country)).attr("y", d => y(d.value))
    .attr("width", x.bandwidth()).attr("height", d => H - y(d.value))
    .attr("fill", d => alarmColor(d.value)).attr("rx", 2)
    .on("mousemove", (evt,d) => showTip(`${d.country}: ${d.value.toFixed(2)} kg`, evt))
    .on("mouseleave", hideTip);

  g.append("text").attr("x", W/2).attr("y",-14).attr("text-anchor","middle")
    .style("font-size","10.5px").style("fill","#b83228")
    .text("★  These nations lead global climate performance  ★");

  g.append("g").attr("transform",`translate(0,${H})`).call(d3.axisBottom(x))
    .call(ax => { ax.select(".domain").attr("stroke","#ccc");
      ax.selectAll("text").attr("transform","rotate(-30)").attr("text-anchor","end")
        .style("font-size","10px").style("fill","#444"); });

  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => d.toFixed(1) + " kg"))
    .call(ax => { ax.select(".domain").remove(); ax.selectAll("text").style("font-size","10px").style("fill","#555"); });

  g.append("text").attr("transform","rotate(-90)").attr("x",-H/2).attr("y",-58)
    .attr("text-anchor","middle").style("font-size","10px").style("fill","#777")
    .text("kg CO₂-equivalent per person (2023)");
}

// The black hat line chart
function drawBlackLine(allRows) {
  // Only 2018–2023 where we only cherry-picked low emitters
  const filtered = allRows.filter(d => BH_LINE_COUNTRIES.includes(d.country) && d.year >= 2018);

  const { g, W, H } = makeSvg("black-line", 720, 320, { l:68, r:120, t:36, b:50 });

  const years = [...new Set(filtered.map(d => d.year))].sort();
  const x = d3.scaleLinear().domain(d3.extent(years)).range([0, W]);
  // The Zoomed y-axis which does not start at zero
  const yMin = d3.min(filtered, d => d.value) * 0.95;
  const yMax = d3.max(filtered, d => d.value) * 1.03;
  const y = d3.scaleLinear().domain([yMin, yMax]).range([H, 0]);

  gridlines(g, d3.axisLeft(y).ticks(5), W);

  const lineGen = d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);

  BH_LINE_COUNTRIES.forEach(country => {
    const pts = filtered.filter(d => d.country === country).sort((a,b) => a.year - b.year);
    if (!pts.length) return;
    const col = BH_COLORS[country] || "#888";

    g.append("path").datum(pts).attr("fill","none").attr("stroke",col).attr("stroke-width",2.6).attr("d",lineGen);

    g.selectAll(null).data(pts).enter().append("circle")
      .attr("cx", d => x(d.year)).attr("cy", d => y(d.value))
      .attr("r", 3.5).attr("fill", col)
      .on("mousemove", (evt,d) => showTip(`${country}: ${d.value.toFixed(2)} kg`, evt))
      .on("mouseleave", hideTip);

    const last = pts[pts.length - 1];
    g.append("text").attr("x", x(last.year)+7).attr("y", y(last.value)+4)
      .style("font-size","10px").style("fill",col).style("font-weight","700").text(country);
  });

  g.append("text").attr("x", W/2).attr("y",-14).attr("text-anchor","middle")
    .style("font-size","10.5px").style("fill","#b83228")
    .text("Emissions COLLAPSING — European climate action is working!");

  g.append("g").attr("transform",`translate(0,${H})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(years.length))
    .call(ax => { ax.select(".domain").attr("stroke","#ccc"); ax.selectAll("text").style("font-size","10px").style("fill","#555"); });

  g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(d => d.toFixed(1) + " kg"))
    .call(ax => { ax.select(".domain").remove(); ax.selectAll("text").style("font-size","10px").style("fill","#555"); });

  g.append("text").attr("transform","rotate(-90)").attr("x",-H/2).attr("y",-54)
    .attr("text-anchor","middle").style("font-size","10px").style("fill","#777")
    .text("kg CO₂-equivalent per person");
}

// loads the csv and then we draw everything else
d3.csv(CSV_PATH).then(raw => {
  // This keeps only 3-letter country codes
  const allRows = raw
    .filter(d => d["REF_AREA"].length === 3 && d["OBS_VALUE"] !== "")
    .map(d => ({
      country: d["Reference area"],
      code:    d["REF_AREA"],
      year:    +d["TIME_PERIOD"],
      value:   +d["OBS_VALUE"]
    }));

  const data2023 = allRows.filter(d => d.year === 2023);

  drawWhiteBar(data2023);
  drawWhiteLine(allRows);
  drawBlackBar(data2023);
  drawBlackLine(allRows);
});