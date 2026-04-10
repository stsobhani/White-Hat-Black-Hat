# White Hat vs Black Hat Data Visualization

This project explores how **design choices in data visualization can influence interpretation**, using OECD greenhouse gas emissions data.

It presents two contrasting approaches:
- **White Hat Visualization** → Honest, clear, and accurate
- **Black Hat Visualization** → Misleading and manipulative (for educational purposes)

---

## Live Website

[https://stsobhani.github.io/White-Hat-Black-Hat/index.html](https://stsobhani.github.io/White-Hat-Black-Hat/)

---

## Project Overview

This project visualizes **greenhouse gas emissions per capita (2014–2023)** across OECD countries.

The goal is to demonstrate:
- The importance of **ethical visualization design**
- How misleading techniques can distort perception
- How the **same dataset** can tell very different stories

---

## Key Features

- Interactive **bar and line charts** built with D3.js
- Hover tooltips for detailed values
- Consistent color encoding (White Hat)
- Intentional distortion techniques (Black Hat), including:
  - Selective filtering of countries
  - Truncated y-axis
  - Misleading titles and framing

---

## White Hat vs Black Hat

### White Hat Visualization
- Uses **complete dataset**
- Starts axes at **zero**
- Uses **accurate labels and scales**
- Designed for clarity and truth

### Black Hat Visualization
- Uses **selective data**
- Manipulates axes and scaling
- Uses **emotionally biased titles**
- Designed to **mislead the viewer**
