export type Observation = {
  source_id: string
  ra: number | null
  dec: number | null
  observed_start: string | null
  wavelength_um: [number | null, number | null]
  access_url: string
}

export async function searchObservations(ra: number, dec: number) {
  const res = await fetch(`/api/observations?ra=${ra}&dec=${dec}`)
  if (!res.ok) throw new Error(`Server error ${res.status}`)
  const data = await res.json()
  return data.results as Observation[]
}