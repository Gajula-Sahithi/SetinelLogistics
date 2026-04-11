import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Layout from '../components/Layout';
import { Shield, MapPin, Navigation, Info, Maximize2 } from 'lucide-react';

// Fix for leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Heatmap = () => {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    const shipmentsRef = ref(db, 'shipments');
    const unsubscribe = onValue(shipmentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setShipments(Object.values(data));
    });
    return () => unsubscribe();
  }, []);

  const getMarkerIcon = (status) => {
    const color = status === 'AT_RISK' ? '#f59e0b' : (status === 'DELAYED' ? '#ef4444' : '#3b82f6');
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 3px solid #000; box-shadow: 0 0 15px ${color}"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-8 pb-10">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter">Spatial Analysis</h1>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mt-1">Real-time GPS Telemetry Grid</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-zinc-900 px-5 py-2.5 rounded-xl border border-zinc-800">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">System Online</span>
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-8 min-h-[650px]">
          {/* Map Container - 3/4 width */}
          <div className="xl:col-span-3 card-premium p-1 relative overflow-hidden group border-zinc-800/60 ring-1 ring-zinc-800/20">
            <MapContainer 
              center={[20, 0]} 
              zoom={2.5} 
              className="w-full h-full rounded-lg z-0"
              style={{ background: '#000' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              {shipments.map((shipment) => (
                <React.Fragment key={shipment.id}>
                  <Marker 
                    position={[shipment.currentLat, shipment.currentLng]} 
                    icon={getMarkerIcon(shipment.status)}
                  >
                    <Popup className="premium-popup">
                      <div className="p-4 min-w-[220px] bg-black text-white rounded-xl shadow-2xl border border-zinc-800">
                        <div className="flex justify-between items-start mb-4 border-b border-zinc-800 pb-3">
                           <div>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Asset ID</p>
                              <p className="text-sm font-black text-white tracking-tight">{shipment.id}</p>
                           </div>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${shipment.status === 'ON_TRACK' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                              {shipment.status}
                           </span>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-center gap-3">
                              <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                              <p className="text-[10px] font-bold text-zinc-300">{shipment.origin} &rarr; {shipment.destination}</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <Navigation className="w-3.5 h-3.5 text-zinc-600" />
                              <p className="text-[10px] font-bold text-zinc-300">Lat: {shipment.currentLat.toFixed(4)}, Lng: {shipment.currentLng.toFixed(4)}</p>
                           </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  {shipment.status !== 'ON_TRACK' && (
                    <Circle 
                      center={[shipment.currentLat, shipment.currentLng]} 
                      radius={500000} 
                      pathOptions={{ color: shipment.status === 'AT_RISK' ? '#f59e0b' : '#ef4444', fillOpacity: 0.05, weight: 1 }}
                    />
                  )}
                </React.Fragment>
              ))}
            </MapContainer>
            
            {/* Overlay Map Controls */}
            <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2">
               <button className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 transition-all">
                  <Maximize2 className="w-5 h-5" />
               </button>
            </div>

            <div className="absolute bottom-10 right-10 z-[1000]">
               <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-6 rounded-2xl shadow-2xl min-w-[200px]">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Legend Cluster</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      <span className="text-[11px] font-bold text-zinc-300">On Track Protocol</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                      <span className="text-[11px] font-bold text-zinc-300">Intelligence Warning</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                      <span className="text-[11px] font-bold text-zinc-300">Critical Disruption</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Side Info - 1/4 width */}
          <div className="xl:col-span-1 space-y-6">
            <div className="card-premium p-6">
               <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Telemetry Stats
               </h3>
               <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                     <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Global Coverage</p>
                     <p className="text-2xl font-black text-white tracking-tighter">98.4<span className="text-sm font-medium text-zinc-700 ml-1">%</span></p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                     <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Satellite Fixed</p>
                     <p className="text-2xl font-black text-white tracking-tighter">24 <span className="text-[10px] text-emerald-500 font-bold ml-1">LOCKED</span></p>
                  </div>
               </div>
            </div>

            <div className="card-premium p-6 flex-1">
               <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Recent Anomaly Clusters</h3>
               <div className="space-y-3">
                  {shipments.filter(s => s.status !== 'ON_TRACK').slice(0, 4).map(s => (
                    <div key={s.id} className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/30 hover:border-zinc-700 transition-colors cursor-pointer group">
                       <div className="flex justify-between items-start">
                          <p className="text-xs font-black text-white tracking-tight">{s.id}</p>
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-amber-500 transition-colors">Alert</span>
                       </div>
                       <p className="text-[10px] text-zinc-500 font-medium mt-1 truncate">{s.origin} Corrdior Risk</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Heatmap;
