declare module "zalando-tech-radar/docs/radar.js" {
  type TechRadarConfig = {
    svg_id: string
    width: number
    height: number
    colors: {
      background: string
      grid: string
      inactive: string
    }
    title: string
    quadrants: { name: string }[]
    rings: { name: string; color: string }[]
    print_layout: boolean
    entries: {
      label: string
      reason?: string
      quadrant: number
      ring: number
      moved: number
    }[]
  }

  export function radar_visualization(config: TechRadarConfig)
}
