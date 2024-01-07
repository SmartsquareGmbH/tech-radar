import * as d3 from "d3"
import { radar_visualization } from "zalando-tech-radar/docs/radar.js"
import { dataManagement, infrastructure, languagesAndFrameworks, tools } from "./data.json"
import { version } from "./package.json"

radar_visualization({
  svg_id: "radar",
  width: 1500,
  height: 1000,
  colors: {
    background: "#fff",
    grid: "#bbb",
    inactive: "#ddd",
  },
  title: `Smartsquare Tech Radar — ${version}`,
  quadrants: [
    { name: "Languages and Frameworks" },
    { name: "Data Management" },
    { name: "Infrastructure" },
    { name: "Tools and Techniques" },
  ],
  rings: [
    { name: "ADOPT", color: "#93c47d" },
    { name: "TRIAL", color: "#93d2c2" },
    { name: "ASSESS", color: "#fbdb84" },
    { name: "HOLD", color: "#efafa9" },
  ],
  print_layout: true,
  entries: [
    ...languagesAndFrameworks.map((it) => ({ ...it, quadrant: 0 })),
    ...dataManagement.map((it) => ({ ...it, quadrant: 1 })),
    ...infrastructure.map((it) => ({ ...it, quadrant: 2 })),
    ...tools.map((it) => ({ ...it, quadrant: 3 })),
  ],
})

const reasonBox = d3
  .select("#canvas")
  .append("div")
  .style("display", "inline")
  .style("position", "absolute")
  .style("top", "0")
  .style("left", "0")
  .style("width", "400px")
  .style("height", "200px")
  .style("visibility", "hidden")
  .style("border", "2px")
  .style("border-style", "solid")
  .style("border-color", "#e5e5e5")
  .style("padding", "10px")
  .style("background", "rgba(245,245,245,0.9)")
  .style("font-family", "Arial, Helvetica")
  .style("font-size", "12")

function hideReason() {
  reasonBox.html("").style("top", "0").style("left", "0").style("visibility", "hidden")
}

function showReason(item: any) {
  d3.event.stopPropagation()

  reasonBox
    .html("")
    .style("top", Math.min(d3.event.pageY + 20, window.innerHeight - 244) + "px")
    .style("left", Math.min(d3.event.pageX + 20, window.innerWidth - 444) + "px")
    .style("visibility", "visible")

  reasonBox.append("h3").style("margin-top", "0px").text(item.label)
  reasonBox.append("p").html(item.reason || "No reason given yet ¯\\_(ツ)_/¯")
}

d3.select("#canvas").on("click", hideReason)
d3.selectAll("[id^='legendItem']").on("click", showReason)
