import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue with Leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const ShipmentMap = ({ origin, destination, currentLocation, transportType, shipmentId }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [distanceCovered, setDistanceCovered] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [eta, setEta] = useState(null);
  const [etaLoading, setEtaLoading] = useState(false);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get transport-specific routing profile for OSRM
  const getRoutingProfile = (transport) => {
    // OSRM uses: car, bike, foot (we'll use car for most, adjust speeds for ETA)
    return 'car';
  };

  // Fetch route from OSRM API (free, no API key required)
  const fetchRoute = async (originCoords, destCoords) => {
    setLoading(true);
    try {
      const profile = getRoutingProfile(transportType);
      // OSRM API - free, no API key needed
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/${profile}/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        const distance = route.distance / 1000; // Convert to km
        const duration = route.duration / 60; // Convert to minutes
        setRouteData({ coordinates, distance, duration });
        setTotalDistance(distance);
        
        console.log('OSRM Route fetched:', { distance: distance.toFixed(2), coordinates: coordinates.length });
        
        // Calculate distances along the route (not straight line)
        if (currentLocation && currentLocation.lat && currentLocation.lng) {
          const covered = calculateDistance(originCoords.lat, originCoords.lng, currentLocation.lat, currentLocation.lng);
          const remaining = distance - covered;
          setDistanceCovered(covered);
          setDistanceRemaining(Math.max(0, remaining));
          
          // Fetch ETA from Gemini API
          fetchEta(distance, Math.max(0, remaining), transportType);
        }
      } else {
        throw new Error('OSRM returned no route');
      }
    } catch (error) {
      console.error('Error fetching route from OSRM:', error);
      // Fallback to straight line
      const fallbackDistance = calculateDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
      setRouteData({
        coordinates: [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]],
        distance: fallbackDistance,
        duration: null
      });
      setTotalDistance(fallbackDistance);
      
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        const covered = calculateDistance(originCoords.lat, originCoords.lng, currentLocation.lat, currentLocation.lng);
        const remaining = fallbackDistance - covered;
        setDistanceCovered(covered);
        setDistanceRemaining(Math.max(0, remaining));
        
        // Fetch ETA with fallback distance
        fetchEta(fallbackDistance, Math.max(0, remaining), transportType);
      }
    }
    setLoading(false);
  };

  // Fetch ETA from Gemini API via backend
  const fetchEta = async (totalDist, remainingDist, transport) => {
    setEtaLoading(true);
    try {
      if (!shipmentId) return;

      // Fetch shipment details
      let shipment = {
        id: shipmentId,
        transportType: transport || 'Road'
      };

      const response = await axios.post('/api/estimate-eta', {
        totalDistance: totalDist,
        remainingDistance: remainingDist,
        transportType: shipment.transportType,
        shipmentId: shipment.id
      }, {
        timeout: 10000 // 10 second timeout
      });
      if (response.data && response.data.eta) {
        setEta(response.data.eta);
      } else {
        throw new Error('No ETA in response');
      }
    } catch (error) {
      console.error('Error fetching ETA:', error);
      // Fallback to simple calculation
      const speeds = {
        'Road': 60, // km/h
        'Rail': 80,
        'Air': 800,
        'Sea': 30,
        'Multi-modal': 50
      };
      const speed = speeds[transport] || 60;
      const hours = remainingDist / speed;
      if (hours < 1) {
        setEta(`${Math.ceil(hours * 60)} minutes`);
      } else if (hours < 24) {
        setEta(`${Math.ceil(hours)} hours`);
      } else {
        setEta(`${Math.ceil(hours / 24)} days`);
      }
    }
    setEtaLoading(false);
  };

  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    if (origin && destination) {
      const originCoords = typeof origin === 'string' ? { lat: 20.5937, lng: 78.9629 } : origin;
      const destCoords = typeof destination === 'string' ? { lat: 28.6139, lng: 77.2090 } : destination;

      // Fetch actual route
      fetchRoute(originCoords, destCoords);

      // Origin marker (green)
      const originIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #22c55e; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      L.marker([originCoords.lat, originCoords.lng], { icon: originIcon }).addTo(mapInstanceRef.current)
        .bindPopup(`Origin: ${typeof origin === 'string' ? origin : 'Start Point'}`);

      // Destination marker (red)
      const destIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      L.marker([destCoords.lat, destCoords.lng], { icon: destIcon }).addTo(mapInstanceRef.current)
        .bindPopup(`Destination: ${typeof destination === 'string' ? destination : 'End Point'}`);

      // Current location marker (blue)
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        const currentIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: #2563eb; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        L.marker([currentLocation.lat, currentLocation.lng], { icon: currentIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('Current Location');

        // Don't calculate distances here - let fetchRoute handle it with actual route distance
      }
    }
  }, [origin, destination, currentLocation, transportType]);

  // Draw route when route data is available
  useEffect(() => {
    if (!mapInstanceRef.current || !routeData) return;

    const routeLine = L.polyline(routeData.coordinates, {
      color: '#3b82f6',
      weight: 5,
      opacity: 0.8
    }).addTo(mapInstanceRef.current);

    mapInstanceRef.current.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(routeLine);
      }
    };
  }, [routeData]);

  return (
    <div>
      <div 
        ref={mapRef} 
        style={{ height: '450px', width: '100%', borderRadius: '12px', border: '2px solid var(--border-primary)' }}
      />
      {loading && (
        <div className="text-center mt-2 text-sm text-[var(--text-tertiary)]">
          Loading route...
        </div>
      )}
      {!loading && routeData && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
              <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Total Distance</p>
              <p className="text-lg font-black text-[var(--text-primary)]">{totalDistance.toFixed(1)} km</p>
            </div>
            <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
              <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Covered</p>
              <p className="text-lg font-black text-[var(--success)]">{distanceCovered.toFixed(1)} km</p>
            </div>
            <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
              <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Remaining</p>
              <p className="text-lg font-black text-[var(--warning)]">{distanceRemaining.toFixed(1)} km</p>
            </div>
          </div>
          {etaLoading ? (
            <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-lg p-3">
              <p className="text-xs font-black text-[var(--accent-primary)] uppercase tracking-widest">
                Calculating ETA with AI...
              </p>
            </div>
          ) : eta && (
            <div className="bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg p-3">
              <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Estimated Time of Arrival</p>
              <p className="text-xl font-black text-[var(--success)]">{eta}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShipmentMap;

