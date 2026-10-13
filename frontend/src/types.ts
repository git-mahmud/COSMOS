export type Candidate = {
  id: number
  ra: number
  dec: number
  x_frac: number
  y_frac: number
  sigma: number
  sign: string
  area_px: number
  flag: string | null
  status: string
}