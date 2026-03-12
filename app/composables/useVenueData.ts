export function useVenueData() {
  const enrichPerformance = (performance: any) => {
    return {
      ...performance,
      mapQuery: performance.venue || ''
    }
  }

  return {
    enrichPerformance
  }
}
