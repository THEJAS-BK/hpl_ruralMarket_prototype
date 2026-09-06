import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 10, { duration: 1.2 });
    }
  }, [map, position]);
  return null;
}