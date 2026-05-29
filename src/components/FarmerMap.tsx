import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Farmer } from '../types';

// Fix for default marker icons in Leaflet with React
// Using CDN URLs to avoid Vite resolution issues in some environments
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FarmerMapProps {
  farmers: Farmer[];
}

export default function FarmerMap({ farmers }: FarmerMapProps) {
  // Default center (Karawang area as BBI Cipule is there)
  const defaultCenter: [number, number] = [-6.3128, 107.2944];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Peta Lokasi Pembudidaya</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[600px] relative z-0">
        <MapContainer center={defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {farmers.map((farmer) => (
            farmer.latitude && farmer.longitude ? (
              <Marker key={farmer.id} position={[farmer.latitude, farmer.longitude]}>
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-blue-600">{farmer.namaPenanggungjawab}</h3>
                    <p className="text-xs font-semibold text-slate-700">{farmer.kecamatan}, {farmer.desa}</p>
                    <p className="text-xs text-slate-500 mt-1">{farmer.kegiatanUsaha}</p>
                    <p className="text-xs text-slate-400 mt-2 italic">{farmer.alamat}</p>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
