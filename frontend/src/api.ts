export type Observation = {
  source_id: string
  ra: number | null
  dec: number | null
  observed_start: string | null
  wavelength_um: [number | null, number | null]
  access_url: string
}

export async function searchObservations(ra: number, dec: number) {
  const res = await fetch(`/api/observations?ra=${ra}&dec=${dec}&limit=200`)
  if (!res.ok) throw new Error(`Server error ${res.status}`)
  const data = await res.json()
  return data.results as Observation[]
}

export async function getObservation(id: string) {
  const res = await fetch(`/api/observation?id=${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error(`Server error ${res.status}`)
  return (await res.json()) as Observation
}