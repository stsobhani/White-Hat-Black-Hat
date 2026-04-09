// The path to the downloaded csv file!
const CSV_PATH =
  "data/OECD.ENV.EPI,DSD_AIR_GHG@DF_AIR_GHG,+.A.GHG._T.KG_CO2E_PS.csv";

// The country groupings for the 4 different visualizations
const LINE_COUNTRIES = [
  "Australia",
  "Canada",
  "Germany",
  "France",
  "United Kingdom",
  "Sweden",
  "Japan",
];
const BH_BAR_COUNTRIES = [
  "Sweden",
  "Malta",
  "Switzerland",
  "Portugal",
  "Latvia",
  "Hungary",
  "United Kingdom",
  "France",
];
const BH_LINE_COUNTRIES = ["France", "United Kingdom", "Sweden", "Portugal"];
const BH_LINE_LABELS = { "United Kingdom": "UK" };

// The color mapping
const LINE_COLORS = {
  Australia: "#e07b39",
  Canada: "#c0392b",
  Germany: "#2c3e50",
  France: "#2980b9",
  "United Kingdom": "#16a085",
  Sweden: "#27ae60",
  Japan: "#d35400",
};
const BH_COLORS = {
  France: "#e67e22",
  "United Kingdom": "#e74c3c",
  Sweden: "#9b59b6",
  Portugal: "#c0392b",
};

// Controls the tooltip!
const tip = document.getElementById("tooltip");
function showTip(html, evt) {
  tip.innerHTML = html;
  tip.style.opacity = 1;
  moveTip(evt);
}
function moveTip(evt) {
  tip.style.left = evt.clientX + 14 + "px";
  tip.style.top = evt.clientY - 10 + "px";
}
function hideTip() {
  tip.style.opacity = 0;
}

// Helper function for the SVG
function makeSvg(id, vw, vh, m) {
  const g = d3
    .select("#" + id)
    .append("svg")
    .attr("viewBox", "0 0 " + vw + " " + vh)
    .style("width", "100%")
    .style("display", "block")
    .append("g")
    .attr("transform", "translate(" + m.l + "," + m.t + ")");
  return { g, W: vw - m.l - m.r, H: vh - m.t - m.b };
}
// Adds the gridlines to the chart
function gridlines(g, axFn, len) {
  g.append("g")
    .call(axFn.tickSize(-len).tickFormat(""))
    .call((gr) => {
      gr.select(".domain").remove();
      gr.selectAll("line")
        .attr("stroke", "#e0ddd8")
        .attr("stroke-dasharray", "3,3");
    });
}

// Avoids the collision we had earlier with the labels on the right side
function resolveLabels(slots, gap) {
  slots.sort((a, b) => a.y - b.y);
  for (let pass = 0; pass < 30; pass++) {
    let moved = false;
    for (let i = 1; i < slots.length; i++) {
      const needed = slots[i - 1].y + slots[i - 1].h + gap;
      if (slots[i].y < needed) {
        slots[i].y = needed;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return slots;
}

// Creates the white bar!
function drawWhiteBar(byCountryYear) {
  // Builds the 2023 snapshot and compute the percentage change from 2014 for each country
  const data = Object.keys(byCountryYear)
    .filter((c) => byCountryYear[c][2023] != null)
    .map((c) => {
      const v2023 = byCountryYear[c][2023];
      const v2014 = byCountryYear[c][2014];
      const pct =
        v2014 != null
          ? Math.round(((v2023 - v2014) / v2014) * 1000) / 10
          : null;
      return { country: c, value: v2023, pct };
    })
    .sort((a, b) => b.value - a.value);

  const maxVal = data[0].value;
  const { g, W, H } = makeSvg("white-bar", 960, 420, {
    l: 66,
    r: 20,
    t: 24,
    b: 128,
  });
  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.country))
    .range([0, W])
    .padding(0.2);
  const y = d3
    .scaleLinear()
    .domain([0, maxVal * 1.08])
    .range([H, 0]);
  const colFn = (v) => d3.interpolateRdYlGn(1 - v / maxVal);

  gridlines(g, d3.axisLeft(y).ticks(6), W);

  g.selectAll("rect.wb")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "wb")
    .attr("x", (d) => x(d.country))
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", (d) => H - y(d.value))
    .attr("fill", (d) => colFn(d.value))
    .attr("rx", 1)
    .on("mousemove", (evt, d) => {
      const pctStr =
        d.pct != null
          ? "<br><span style='color:#aaa;font-size:11px'>" +
            d.pct +
            "% since 2014</span>"
          : "";
      showTip(
        "<b>" +
          d.country +
          "</b><br>" +
          d.value.toFixed(2) +
          " kg CO\u2082e/person" +
          pctStr,
        evt,
      );
    })
    .on("mouseleave", hideTip);

  // Average reference line computed from the filtered dataset
  const avg = d3.mean(data, (d) => d.value);
  g.append("line")
    .attr("x1", 0)
    .attr("x2", W)
    .attr("y1", y(avg))
    .attr("y2", y(avg))
    .attr("stroke", "#2c3e50")
    .attr("stroke-dasharray", "6,3")
    .attr("stroke-width", 1.5);
  g.append("text")
    .attr("x", W - 4)
    .attr("y", y(avg) - 5)
    .attr("text-anchor", "end")
    .style("font-size", "10px")
    .style("fill", "#2c3e50")
    .text("Average: " + avg.toFixed(2) + " kg");

  g.append("g")
    .attr("transform", "translate(0," + H + ")")
    .call(d3.axisBottom(x))
    .call((ax) => {
      ax.select(".domain").attr("stroke", "#bbb");
      ax.selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .attr("dx", "-.5em")
        .attr("dy", ".15em")
        .style("font-size", "9px")
        .style("fill", "#444");
    });
  g.append("g")
    .call(
      d3
        .axisLeft(y)
        .ticks(6)
        .tickFormat((d) => d + " kg"),
    )
    .call((ax) => {
      ax.select(".domain").remove();
      ax.selectAll("text").style("font-size", "10px").style("fill", "#555");
    });
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -H / 2)
    .attr("y", -52)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#777")
    .text("kg CO\u2082-equivalent per person (2023)");
}

// Creates the white line!
function drawWhiteLine(byCountryYear) {
  const allYears = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];

  // We are only including countries that have data for every year in the range
  const countries = LINE_COUNTRIES.filter(
    (c) =>
      byCountryYear[c] && allYears.every((yr) => byCountryYear[c][yr] != null),
  );

  let maxVal = 0;
  for (const c of countries)
    for (const yr of allYears)
      if (byCountryYear[c][yr] > maxVal) maxVal = byCountryYear[c][yr];

  const { g, W, H } = makeSvg("white-line", 960, 380, {
    l: 68,
    r: 175,
    t: 24,
    b: 50,
  });
  const x = d3.scaleLinear().domain([2014, 2023]).range([0, W]);
  const y = d3
    .scaleLinear()
    .domain([0, maxVal * 1.08])
    .range([H, 0]);
  const lineGen = d3
    .line()
    .x((d) => x(d.yr))
    .y((d) => y(d.val))
    .curve(d3.curveMonotoneX);

  gridlines(g, d3.axisLeft(y).ticks(6), W);

  const series = countries.map((country) => {
    const pts = allYears.map((yr) => ({ yr, val: byCountryYear[country][yr] }));
    const col = LINE_COLORS[country] || "#888";
    // Compute % change from 2014 to 2023 from actual CSV values
    const v2014 = byCountryYear[country][2014];
    const v2023 = byCountryYear[country][2023];
    const pct =
      v2014 != null && v2023 != null
        ? Math.round(((v2023 - v2014) / v2014) * 1000) / 10
        : null;

    g.append("path")
      .datum(pts)
      .attr("fill", "none")
      .attr("stroke", col)
      .attr("stroke-width", 2.2)
      .attr("d", lineGen);
    g.selectAll(".dot" + country.replace(/[\s()]/g, "_"))
      .data(pts)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.yr))
      .attr("cy", (d) => y(d.val))
      .attr("r", 3)
      .attr("fill", col)
      .on("mousemove", (evt, d) =>
        showTip(
          "<b>" +
            country +
            "</b><br>" +
            d.yr +
            ": " +
            d.val.toFixed(2) +
            " kg CO\u2082e",
          evt,
        ),
      )
      .on("mouseleave", hideTip);

    return { country, col, pts, pct, idealY: y(v2023) };
  });

  // Collision-resolve end labels for styling
  const BLOCK_H = 22;
  const slots = series.map((s) => ({ y: s.idealY - 4, h: BLOCK_H }));
  resolveLabels(slots, 3);

  series.forEach((s, i) => {
    const lx = x(2023);
    const sy = slots[i].y;
    g.append("line")
      .attr("x1", lx + 3)
      .attr("x2", lx + 7)
      .attr("y1", s.idealY)
      .attr("y2", sy + 8)
      .attr("stroke", s.col)
      .attr("stroke-width", 0.8)
      .attr("opacity", 0.45);
    g.append("text")
      .attr("x", lx + 9)
      .attr("y", sy + 8)
      .style("font-size", "10px")
      .style("fill", s.col)
      .style("font-weight", "600")
      .text(s.country);
    if (s.pct != null) {
      g.append("text")
        .attr("x", lx + 9)
        .attr("y", sy + 19)
        .style("font-size", "9px")
        .style("fill", s.col)
        .style("opacity", "0.72")
        .text(s.pct + "%");
    }
  });

  g.append("g")
    .attr("transform", "translate(0," + H + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10))
    .call((ax) => {
      ax.select(".domain").attr("stroke", "#bbb");
      ax.selectAll("text").style("font-size", "10px").style("fill", "#555");
    });
  g.append("g")
    .call(
      d3
        .axisLeft(y)
        .ticks(6)
        .tickFormat((d) => d + " kg"),
    )
    .call((ax) => {
      ax.select(".domain").remove();
      ax.selectAll("text").style("font-size", "10px").style("fill", "#555");
    });
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -H / 2)
    .attr("y", -54)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#777")
    .text("kg CO\u2082-equivalent per person");
}

// Draws the black bar
function drawBlackBar(byCountryYear) {
  const data = BH_BAR_COUNTRIES.filter(
    (c) => byCountryYear[c] && byCountryYear[c][2023] != null,
  )
    .map((c) => ({ country: c, value: byCountryYear[c][2023] }))
    .sort((a, b) => a.value - b.value);

  const { g, W, H } = makeSvg("black-bar", 640, 340, {
    l: 74,
    r: 20,
    t: 36,
    b: 72,
  });
  const yMin = d3.min(data, (d) => d.value) * 0.88;
  const x = d3
    .scaleBand()
    .domain(data.map((d) => d.country))
    .range([0, W])
    .padding(0.28);
  const y = d3
    .scaleLinear()
    .domain([yMin, d3.max(data, (d) => d.value) * 1.04])
    .range([H, 0]);
  const alarm = d3
    .scaleSequential(d3.interpolateYlOrRd)
    .domain([yMin, d3.max(data, (d) => d.value)]);

  gridlines(g, d3.axisLeft(y).ticks(5), W);
  g.selectAll("rect.bb")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bb")
    .attr("x", (d) => x(d.country))
    .attr("y", (d) => y(d.value))
    .attr("width", x.bandwidth())
    .attr("height", (d) => H - y(d.value))
    .attr("fill", (d) => alarm(d.value))
    .attr("rx", 2)
    .on("mousemove", (evt, d) =>
      showTip(d.country + ": " + d.value.toFixed(2) + " kg", evt),
    )
    .on("mouseleave", hideTip);

  g.append("text")
    .attr("x", W / 2)
    .attr("y", -14)
    .attr("text-anchor", "middle")
    .style("font-size", "10.5px")
    .style("fill", "#b83228")
    .text("\u26A0  These nations lead global climate performance!!!  \u26A0");

  g.append("g")
    .attr("transform", "translate(0," + H + ")")
    .call(d3.axisBottom(x))
    .call((ax) => {
      ax.select(".domain").attr("stroke", "#ccc");
      ax.selectAll("text")
        .attr("transform", "rotate(-30)")
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .style("fill", "#444");
    });
  g.append("g")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => d.toFixed(1) + " kg"),
    )
    .call((ax) => {
      ax.select(".domain").remove();
      ax.selectAll("text").style("font-size", "10px").style("fill", "#555");
    });
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -H / 2)
    .attr("y", -58)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#777")
    .text("kg CO\u2082-equivalent per person (2023)");
}

// Draws the black line!
function drawBlackLine(byCountryYear) {
  const bhYears = [2018, 2019, 2020, 2021, 2022, 2023];

  const series = BH_LINE_COUNTRIES.filter(
    (c) =>
      byCountryYear[c] && bhYears.every((yr) => byCountryYear[c][yr] != null),
  ).map((c) => ({
    country: c,
    label: BH_LINE_LABELS[c] || c,
    pts: bhYears.map((yr) => ({ yr, val: byCountryYear[c][yr] })),
  }));

  const allVals = series.flatMap((s) => s.pts.map((p) => p.val));
  const yMin = d3.min(allVals) * 0.95,
    yMax = d3.max(allVals) * 1.03;

  const { g, W, H } = makeSvg("black-line", 720, 320, {
    l: 68,
    r: 115,
    t: 36,
    b: 50,
  });
  const x = d3.scaleLinear().domain([2018, 2023]).range([0, W]);
  const y = d3.scaleLinear().domain([yMin, yMax]).range([H, 0]);
  const lineGen = d3
    .line()
    .x((d) => x(d.yr))
    .y((d) => y(d.val))
    .curve(d3.curveMonotoneX);

  gridlines(g, d3.axisLeft(y).ticks(5), W);

  for (const { country, label, pts } of series) {
    const col = BH_COLORS[country] || "#888";
    g.append("path")
      .datum(pts)
      .attr("fill", "none")
      .attr("stroke", col)
      .attr("stroke-width", 2.6)
      .attr("d", lineGen);
    g.selectAll(".bd" + country.replace(/[\s()]/g, "_"))
      .data(pts)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.yr))
      .attr("cy", (d) => y(d.val))
      .attr("r", 3.5)
      .attr("fill", col)
      .on("mousemove", (evt, d) =>
        showTip(label + ": " + d.val.toFixed(2) + " kg", evt),
      )
      .on("mouseleave", hideTip);
  }

  // Fixes the collision of some of the labels
  const BLOCK_H = 13;
  const slots = series.map((s) => ({
    y: y(s.pts[s.pts.length - 1].val) - 4,
    h: BLOCK_H,
  }));
  resolveLabels(slots, 3);

  series.forEach((s, i) => {
    const col = BH_COLORS[s.country] || "#888";
    const lx = x(2023);
    const endY = y(s.pts[s.pts.length - 1].val);
    const sy = slots[i].y;
    g.append("line")
      .attr("x1", lx + 3)
      .attr("x2", lx + 7)
      .attr("y1", endY)
      .attr("y2", sy + 8)
      .attr("stroke", col)
      .attr("stroke-width", 0.8)
      .attr("opacity", 0.45);
    g.append("text")
      .attr("x", lx + 9)
      .attr("y", sy + 8)
      .style("font-size", "10px")
      .style("fill", col)
      .style("font-weight", "700")
      .text(s.label);
  });

  g.append("text")
    .attr("x", W / 2)
    .attr("y", -14)
    .attr("text-anchor", "middle")
    .style("font-size", "10.5px")
    .style("fill", "#b83228")
    .text("Emissions COLLAPSING - European climate action is working!");

  g.append("g")
    .attr("transform", "translate(0," + H + ")")
    .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(6))
    .call((ax) => {
      ax.select(".domain").attr("stroke", "#ccc");
      ax.selectAll("text").style("font-size", "10px").style("fill", "#555");
    });
  g.append("g")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat((d) => d.toFixed(1) + " kg"),
    )
    .call((ax) => {
      ax.select(".domain").remove();
      ax.selectAll("text").style("font-size", "10px").style("fill", "#555");
    });
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -H / 2)
    .attr("y", -54)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#777")
    .text("kg CO\u2082-equivalent per person");
}

// We load from the downloaded csv file and then we draw all the diagrams we designed
d3.csv(CSV_PATH).then((raw) => {
  // filters to individul countries!
  const byCountryYear = {};
  raw
    .filter((d) => d["REF_AREA"].length === 3 && d["OBS_VALUE"] !== "")
    .forEach((d) => {
      const country = d["Reference area"];
      const year = +d["TIME_PERIOD"];
      const value = +d["OBS_VALUE"];
      if (!byCountryYear[country]) byCountryYear[country] = {};
      byCountryYear[country][year] = value;
    });

  drawWhiteBar(byCountryYear);
  drawWhiteLine(byCountryYear);
  drawBlackBar(byCountryYear);
  drawBlackLine(byCountryYear);
});
