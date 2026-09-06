export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distanceKm: number;
  durationMin: number;
  coordinates: [number, number][]; // [lat, lng] pairs, ready for Leaflet <Polyline positions={...}>
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export async function getRoute(
  origin: RoutePoint,
  dest: RoutePoint,
): Promise<RouteInfo> {
  const url = `${OSRM_BASE}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Route request failed");
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error("No route found");
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    coordinates: route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
    ),
  };
}
