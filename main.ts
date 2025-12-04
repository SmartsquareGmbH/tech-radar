import { radarVisualization } from "./radar"
import { dataManagement, infrastructure, languagesAndFrameworks, tools } from "./data.json"
import { version } from "./package.json"

radarVisualization({
  svg_id: "radar",
  width: 1500,
  height: 1000,
  colors: {
    background: "#fff",
    grid: "#bbb",
    inactive: "#ddd",
  },
  title: `Smartsquare Tech Radar — ${version}`,
  emptyReasonText: "No reason given yet ¯\\_(ツ)_/¯",
  quadrants: [
    { name: "Languages and Frameworks" },
    { name: "Data Management" },
    { name: "Infrastructure" },
    { name: "Tools and Techniques" },
  ],
  rings: [
    { name: "ADOPT", color: "#5ba300" },
    { name: "TRIAL", color: "#009eb0" },
    { name: "ASSESS", color: "#c7ba00" },
    { name: "HOLD", color: "#e09b96" },
  ],
  entries: [
    ...languagesAndFrameworks.map((it) => ({ ...it, quadrant: 0 })),
    ...dataManagement.map((it) => ({ ...it, quadrant: 1 })),
    ...infrastructure.map((it) => ({ ...it, quadrant: 2 })),
    ...tools.map((it) => ({ ...it, quadrant: 3 })),
  ],
})

