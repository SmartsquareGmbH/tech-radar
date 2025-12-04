import * as d3 from "d3"

export type TechRadarConfig = {
  svg_id: string
  width: number
  height: number
  colors: {
    background: string
    grid: string
    inactive: string
  }
  title: string
  emptyReasonText?: string
  quadrants: { name: string }[]
  rings: { name: string; color: string }[]
  entries: TechRadarEntry[]
}

export type TechRadarEntry = {
  label: string
  reason?: string
  quadrant: number
  ring: number
  moved: number
}

type BlipEntry = TechRadarEntry & {
  id: string
  x: number
  y: number
  color: string
  segment: Segment
}

type Point = { x: number; y: number }
type Polar = { t: number; r: number }
type Segment = {
  clipx: (d: BlipEntry) => number
  clipy: (d: BlipEntry) => number
  random: () => Point
}

const QUADRANTS = [
  { radial_min: 0, radial_max: 0.5, factor_x: 1, factor_y: 1 },
  { radial_min: 0.5, radial_max: 1, factor_x: -1, factor_y: 1 },
  { radial_min: -1, radial_max: -0.5, factor_x: -1, factor_y: -1 },
  { radial_min: -0.5, radial_max: 0, factor_x: 1, factor_y: -1 },
]

const RINGS = [{ radius: 130 }, { radius: 220 }, { radius: 310 }, { radius: 400 }]

const TITLE_OFFSET = { x: -675, y: -420 }
const FOOTER_OFFSET = { x: -155, y: 450 }
const LEGEND_OFFSET = [
  { x: 450, y: 90 },
  { x: -675, y: 90 },
  { x: -675, y: -310 },
  { x: 450, y: -310 },
]
const LEGEND_COLUMN_WIDTH = 140

const FONT_FAMILY = "Arial, Helvetica"

// Seeded random number generator for reproducible placement
function createRandomGenerator(seed = 42) {
  let currentSeed = seed
  return {
    random(): number {
      const x = Math.sin(currentSeed++) * 10000
      return x - Math.floor(x)
    },
    between(min: number, max: number): number {
      return min + this.random() * (max - min)
    },
    normal(min: number, max: number): number {
      return min + (this.random() + this.random()) * 0.5 * (max - min)
    },
  }
}

function polar(point: Point): Polar {
  return {
    t: Math.atan2(point.y, point.x),
    r: Math.sqrt(point.x * point.x + point.y * point.y),
  }
}

function cartesian(p: Polar): Point {
  return {
    x: p.r * Math.cos(p.t),
    y: p.r * Math.sin(p.t),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max))
}

function translate(x: number, y: number) {
  return `translate(${x},${y})`
}

export function radarVisualization(config: TechRadarConfig) {
  const rng = createRandomGenerator()

  function createSegment(quadrantIndex: number, ringIndex: number): Segment {
    const quadrant = QUADRANTS[quadrantIndex]
    const polarMin: Polar = {
      t: quadrant.radial_min * Math.PI,
      r: ringIndex === 0 ? 30 : RINGS[ringIndex - 1].radius,
    }
    const polarMax: Polar = {
      t: quadrant.radial_max * Math.PI,
      r: RINGS[ringIndex].radius,
    }
    const cartesianMin: Point = {
      x: 15 * quadrant.factor_x,
      y: 15 * quadrant.factor_y,
    }
    const cartesianMax: Point = {
      x: RINGS[3].radius * quadrant.factor_x,
      y: RINGS[3].radius * quadrant.factor_y,
    }

    function boundToSegment(d: BlipEntry): Point {
      const bounded: Point = {
        x: clamp(d.x, cartesianMin.x, cartesianMax.x),
        y: clamp(d.y, cartesianMin.y, cartesianMax.y),
      }
      const p = polar(bounded)
      const clampedPolar: Polar = {
        t: p.t,
        r: clamp(p.r, polarMin.r + 15, polarMax.r - 15),
      }
      return cartesian(clampedPolar)
    }

    return {
      clipx(d: BlipEntry): number {
        d.x = boundToSegment(d).x
        return d.x
      },
      clipy(d: BlipEntry): number {
        d.y = boundToSegment(d).y
        return d.y
      },
      random(): Point {
        return cartesian({
          t: rng.between(polarMin.t, polarMax.t),
          r: rng.normal(polarMin.r, polarMax.r),
        })
      },
    }
  }

  const blipEntries: BlipEntry[] = config.entries.map((entry) => {
    const segment = createSegment(entry.quadrant, entry.ring)
    const point = segment.random()
    return {
      ...entry,
      id: "",
      segment,
      x: point.x,
      y: point.y,
      color: config.rings[entry.ring].color,
    }
  })

  const segmented: BlipEntry[][][] = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => []))

  for (const entry of blipEntries) {
    segmented[entry.quadrant][entry.ring].push(entry)
  }

  let id = 1
  for (const quadrant of [2, 3, 1, 0]) {
    for (let ring = 0; ring < 4; ring++) {
      const entries = segmented[quadrant][ring]
      entries.sort((a, b) => a.label.localeCompare(b.label))
      for (const entry of entries) {
        entry.id = String(id++)
      }
    }
  }

  const svg = d3
    .select<SVGSVGElement, unknown>(`svg#${config.svg_id}`)
    .style("background-color", config.colors.background)
    .attr("width", config.width)
    .attr("height", config.height)

  const radar = svg.append("g")
  radar.attr("transform", translate(config.width / 2, config.height / 2))

  const grid = radar.append("g")

  grid
    .append("line")
    .attr("x1", 0)
    .attr("y1", -400)
    .attr("x2", 0)
    .attr("y2", 400)
    .style("stroke", config.colors.grid)
    .style("stroke-width", 1)

  grid
    .append("line")
    .attr("x1", -400)
    .attr("y1", 0)
    .attr("x2", 400)
    .attr("y2", 0)
    .style("stroke", config.colors.grid)
    .style("stroke-width", 1)

  grid.append("defs")

  for (let i = 0; i < RINGS.length; i++) {
    grid
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", RINGS[i].radius)
      .style("fill", "none")
      .style("stroke", config.colors.grid)
      .style("stroke-width", 1)

    grid
      .append("text")
      .text(config.rings[i].name)
      .attr("y", -RINGS[i].radius + 62)
      .attr("text-anchor", "middle")
      .style("fill", config.rings[i].color)
      .style("opacity", 0.35)
      .style("font-family", FONT_FAMILY)
      .style("font-size", "42px")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .style("user-select", "none")
  }

  function legendTransform(
    quadrant: number,
    ring: number,
    index: number | null = null,
    previousHeight: number = 0
  ): string {
    const dx = ring < 2 ? 0 : LEGEND_COLUMN_WIDTH
    let dy = index === null ? -16 : index * 12

    if (ring % 2 === 1) {
      dy = dy + 36 + previousHeight
    }

    return translate(LEGEND_OFFSET[quadrant].x + dx, LEGEND_OFFSET[quadrant].y + dy)
  }

  radar
    .append("text")
    .attr("transform", translate(TITLE_OFFSET.x, TITLE_OFFSET.y))
    .text(config.title)
    .style("font-family", FONT_FAMILY)
    .style("font-size", "30")
    .style("font-weight", "bold")

  radar
    .append("text")
    .attr("transform", translate(FOOTER_OFFSET.x, FOOTER_OFFSET.y))
    .text("▲ moved up     ▼ moved down     ★ new     ⬤ no change")
    .attr("xml:space", "preserve")
    .style("font-family", FONT_FAMILY)
    .style("font-size", "12px")

  const legend = radar.append("g")

  for (let quadrant = 0; quadrant < 4; quadrant++) {
    legend
      .append("text")
      .attr("transform", translate(LEGEND_OFFSET[quadrant].x, LEGEND_OFFSET[quadrant].y - 45))
      .text(config.quadrants[quadrant].name)
      .style("font-family", FONT_FAMILY)
      .style("font-size", "18px")
      .style("font-weight", "bold")

    let previousLegendHeight = 0

    for (let ring = 0; ring < 4; ring++) {
      if (ring % 2 === 0) {
        previousLegendHeight = 0
      }

      legend
        .append("text")
        .attr("transform", legendTransform(quadrant, ring, null, previousLegendHeight))
        .text(config.rings[ring].name)
        .style("font-family", FONT_FAMILY)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", config.rings[ring].color)

      legend
        .selectAll<SVGTextElement, BlipEntry>(`.legend${quadrant}${ring}`)
        .data(segmented[quadrant][ring])
        .enter()
        .append("text")
        .attr("class", `legend${quadrant}${ring}`)
        .attr("id", (d) => `legendItem${d.id}`)
        .attr("transform", (_, i) => legendTransform(quadrant, ring, i, previousLegendHeight))
        .text((d) => `${d.id}. ${d.label}`)
        .style("font-family", FONT_FAMILY)
        .style("font-size", "11px")
        .style("cursor", "pointer")
        .on("mouseover", function (_event, d) {
          showBubble(d)
          highlightLegendItem(d)
        })
        .on("mouseout", function (_event, d) {
          hideBubble()
          unhighlightLegendItem(d)
        })
        .each(function () {
          previousLegendHeight += d3.select(this).node()!.getBBox().height
        })
    }
  }

  const rink = radar.append("g").attr("id", "rink")

  const bubble = radar
    .append("g")
    .attr("id", "bubble")
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("user-select", "none")

  bubble.append("rect").attr("rx", 4).attr("ry", 4).style("fill", "#333")
  bubble.append("text").style("font-family", FONT_FAMILY).style("font-size", "10px").style("fill", "#fff")
  bubble.append("path").attr("d", "M 0,0 10,0 5,8 z").style("fill", "#333")

  function showBubble(d: BlipEntry) {
    const tooltip = d3.select("#bubble text").text(d.label)
    const bbox = (tooltip.node() as SVGTextElement).getBBox()

    d3.select("#bubble")
      .attr("transform", translate(d.x - bbox.width / 2, d.y - 16))
      .style("opacity", 0.8)

    d3.select("#bubble rect")
      .attr("x", -5)
      .attr("y", -bbox.height)
      .attr("width", bbox.width + 10)
      .attr("height", bbox.height + 4)

    d3.select("#bubble path").attr("transform", translate(bbox.width / 2 - 5, 3))
  }

  function hideBubble() {
    d3.select("#bubble").attr("transform", translate(0, 0)).style("opacity", 0)
  }

  function highlightLegendItem(d: BlipEntry) {
    const legendItem = document.getElementById("legendItem" + d.id) as SVGTextElement | null
    if (legendItem) {
      const bbox = legendItem.getBBox()
      const transform = legendItem.getAttribute("transform") || ""

      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect")
      bg.setAttribute("id", "legendItemBg" + d.id)
      bg.setAttribute("transform", transform)
      bg.setAttribute("x", String(-2))
      bg.setAttribute("y", String(bbox.y - 1))
      bg.setAttribute("width", String(bbox.width + 4))
      bg.setAttribute("height", String(bbox.height + 2))
      bg.setAttribute("fill", "rgba(0, 0, 0, 0.8)")
      bg.setAttribute("rx", "2")
      legendItem.parentNode?.insertBefore(bg, legendItem)
      legendItem.setAttribute("fill", "white")
    }
  }

  function unhighlightLegendItem(d: BlipEntry) {
    const legendItem = document.getElementById("legendItem" + d.id)
    const legendItemBg = document.getElementById("legendItemBg" + d.id)
    if (legendItem) {
      legendItem.removeAttribute("fill")
    }
    if (legendItemBg) {
      legendItemBg.remove()
    }
  }

  const blips = rink
    .selectAll<SVGGElement, BlipEntry>(".blip")
    .data(blipEntries)
    .enter()
    .append("g")
    .attr("class", "blip")
    .on("mouseover", function (_event, d) {
      showBubble(d)
      highlightLegendItem(d)
    })
    .on("mouseout", function (_event, d) {
      hideBubble()
      unhighlightLegendItem(d)
    })

  blips.each(function (d) {
    const blip = d3.select(this)

    if (d.moved === 1) {
      blip.append("path").attr("d", "M -11,5 11,5 0,-13 z").style("fill", d.color)
    } else if (d.moved === -1) {
      blip.append("path").attr("d", "M -11,-5 11,-5 0,13 z").style("fill", d.color)
    } else if (d.moved === 2) {
      blip
        .append("path")
        .attr("d", d3.symbol().type(d3.symbolStar).size(200)() || "")
        .style("fill", d.color)
    } else {
      blip.append("circle").attr("r", 9).attr("fill", d.color)
    }
  })

  blips
    .append("text")
    .text((d) => d.id)
    .attr("y", 3)
    .attr("text-anchor", "middle")
    .style("fill", "#fff")
    .style("font-family", FONT_FAMILY)
    .style("font-size", (d) => (d.id.length > 2 ? "8px" : "9px"))
    .style("pointer-events", "none")
    .style("user-select", "none")

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
    .style("font-family", FONT_FAMILY)
    .style("font-size", "12")

  function hideReason() {
    reasonBox.html("").style("top", "0").style("left", "0").style("visibility", "hidden")
  }

  function showReason(event: MouseEvent, item: unknown) {
    event.stopPropagation()
    const data = item as { label: string; reason?: string }

    reasonBox
      .html("")
      .style("top", Math.min(event.pageY + 20, window.innerHeight - 244) + "px")
      .style("left", Math.min(event.pageX + 20, window.innerWidth - 444) + "px")
      .style("visibility", "visible")

    reasonBox.append("h3").style("margin-top", "0px").text(data.label)
    reasonBox.append("p").html(data.reason || config.emptyReasonText || "No reason")
  }

  d3.select("#canvas").on("click", hideReason)
  d3.selectAll("[id^='legendItem']").on("click", showReason)

  // Force simulation for collision avoidance.
  d3.forceSimulation<BlipEntry>()
    .nodes(blipEntries)
    .velocityDecay(0.19)
    .force("collision", d3.forceCollide<BlipEntry>().radius(12).strength(0.85))
    .on("tick", () => {
      blips.attr("transform", (d) => translate(d.segment.clipx(d), d.segment.clipy(d)))
    })
}
