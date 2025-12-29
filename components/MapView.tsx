
import React, { useEffect, useRef } from 'react';
import { Location } from '../types';

interface MapMarker {
  position: Location;
  label: string;
  type: 'DRIVER' | 'USER' | 'SHOP';
}

interface MapViewProps {
  markers: MapMarker[];
  center?: Location;
  zoom?: number;
  showRouteLine?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ markers, center, zoom = 14, showRouteLine = true }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersGroup = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    // @ts-ignore
    const L = window.L;
    const initialCenter = center || markers[0]?.position || { lat: -23.5505, lng: -46.6333 };
    
    leafletMap.current = L.map(mapRef.current).setView([initialCenter.lat, initialCenter.lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap.current);

    markersGroup.current = L.layerGroup().addTo(leafletMap.current);
    polylineRef.current = L.polyline([], { color: '#4f46e5', weight: 4, opacity: 0.6, dashArray: '10, 10' }).addTo(leafletMap.current);
  }, []);

  useEffect(() => {
    if (!leafletMap.current || !markersGroup.current) return;
    
    // @ts-ignore
    const L = window.L;
    markersGroup.current.clearLayers();

    const bounds = L.latLngBounds();
    const routeCoords: [number, number][] = [];

    // Adiciona o motorista como primeiro ponto da linha se ele existir
    const driverMarker = markers.find(m => m.type === 'DRIVER');
    if (driverMarker) {
      routeCoords.push([driverMarker.position.lat, driverMarker.position.lng]);
    }

    markers.forEach(marker => {
      const color = marker.type === 'DRIVER' ? '#4f46e5' : marker.type === 'SHOP' ? '#f97316' : '#10b981';
      
      // Se não for o motorista, adiciona à linha de rota
      if (marker.type !== 'DRIVER') {
        routeCoords.push([marker.position.lat, marker.position.lng]);
      }

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      L.marker([marker.position.lat, marker.position.lng], { icon })
        .bindPopup(`<b>${marker.label}</b>`)
        .addTo(markersGroup.current);
      
      bounds.extend([marker.position.lat, marker.position.lng]);
    });

    if (showRouteLine && routeCoords.length > 1) {
      polylineRef.current.setLatLngs(routeCoords);
    } else {
      polylineRef.current.setLatLngs([]);
    }

    if (markers.length > 0) {
      leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [markers, showRouteLine]);

  return (
    <div className="w-full h-full min-h-[300px] bg-gray-100 rounded-3xl overflow-hidden border relative">
      <div ref={mapRef} className="absolute inset-0 z-0" />
    </div>
  );
};

export default MapView;
