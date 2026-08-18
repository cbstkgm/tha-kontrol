import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents, Popup, Polyline, Marker, LayersControl, LayerGroup } from 'react-leaflet';
import { X, Layers } from 'lucide-react';

import { parse } from 'wellknown';
import 'leaflet/dist/leaflet.css';
import './RightPanelMap.css';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export interface MapFeature {
  wkt?: string;
  geoJson?: any;
  color: string;
  label?: string;
  adaParsel?: string;
  isHatched?: boolean;
  areaText?: string;
  centroid?: [number, number];
  popupData?: any;
}

interface RightPanelMapProps {
  isOpen: boolean;
  onClose: () => void;
  features: MapFeature[];
  focusFeatures?: MapFeature[];
  titleInfo?: string;
}

const ZoomTracker = ({ onZoomChange }: { onZoomChange: (z: number) => void }) => {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => onZoomChange(map.getZoom()),
  });
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  return null;
};

const BaseLayerTracker = ({ onBaseLayerChange }: { onBaseLayerChange: (name: string) => void }) => {
  useMapEvents({
    baselayerchange: (e: any) => {
      onBaseLayerChange(e.name);
    }
  });
  return null;
};

const parseWKT = (wkt: string) => {
  try {
    return parse(wkt);
  } catch (e) {
    console.error("Geometri parse edilemedi", e);
    return null;
  }
};

const MapController = ({ focusFeatures }: { focusFeatures?: { geoJson: any }[] }) => {
  const map = useMap();
  useEffect(() => {
    if (focusFeatures && focusFeatures.length > 0) {
      try {
        const bounds = L.geoJSON(focusFeatures[0].geoJson).getBounds();
        for (let i = 1; i < focusFeatures.length; i++) {
          bounds.extend(L.geoJSON(focusFeatures[i].geoJson).getBounds());
        }
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
      } catch (err) {
        console.error("Error calculating bounds", err);
      }
    }
  }, [map, focusFeatures]);
  return null;
};

const RightPanelMap: React.FC<RightPanelMapProps> = ({ isOpen, features, focusFeatures, titleInfo, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [parsedFeatures, setParsedFeatures] = useState<{geoJson: any, color: string, label?: string, adaParsel?: string, isHatched?: boolean, areaText?: string, centroid?: [number, number]}[]>([]);
  const [parsedFocusFeatures, setParsedFocusFeatures] = useState<{geoJson: any}[]>([]);
  const [currentZoom, setCurrentZoom] = useState<number>(6);
  const [activeBaseLayer, setActiveBaseLayer] = useState<string>('Google Uydu');
  const [showLayers, setShowLayers] = useState<boolean>(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowLayers(true);
      } else {
        setShowLayers(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomChange = React.useCallback((z: number) => {
    setCurrentZoom(z);
  }, []);

  useEffect(() => {
    if (isOpen && features.length > 0) {
      const parsed: {geoJson: any, color: string, label?: string, adaParsel?: string, isHatched?: boolean, areaText?: string, centroid?: [number, number], popupData?: any}[] = [];
      features.forEach(f => {
        const geoJson = f.geoJson || (f.wkt ? parseWKT(f.wkt) : null);
        if (geoJson) {
          parsed.push({ 
            geoJson, 
            color: f.color,
            label: f.label,
            adaParsel: f.adaParsel,
            isHatched: f.isHatched,
            areaText: f.areaText,
            centroid: f.centroid,
            popupData: f.popupData
          });
        }
      });
      setParsedFeatures(parsed);
    } else if (!isOpen) {
      setParsedFeatures([]);
    }
  }, [isOpen, features]);

  useEffect(() => {
    if (isOpen && focusFeatures && focusFeatures.length > 0) {
      const parsedFocus: {geoJson: any}[] = [];
      focusFeatures.forEach(f => {
        const geoJson = f.geoJson || (f.wkt ? parseWKT(f.wkt) : null);
        if (geoJson) {
          parsedFocus.push({ geoJson });
        }
      });
      setParsedFocusFeatures(parsedFocus);
    } else if (!isOpen) {
      setParsedFocusFeatures([]);
    }
  }, [isOpen, focusFeatures]);

  // Dışarı tıklayınca kapanma iptal edildi, sadece kapatma butonu ile kapanacak.

  const baseLayersData = [
    { name: 'Açık Tema (Mevcut)', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap' },
    { name: 'Google Harita', url: 'http://mt0.google.com/vt/lyrs=m&hl=tr&x={x}&y={y}&z={z}', attribution: '&copy; Google' },
    { name: 'Google Uydu', url: 'http://mt0.google.com/vt/lyrs=s&hl=tr&x={x}&y={y}&z={z}', attribution: '&copy; Google' },
    { name: 'Google Hibrit (Uydu+Yol)', url: 'http://mt0.google.com/vt/lyrs=y&hl=tr&x={x}&y={y}&z={z}', attribution: '&copy; Google' },
    { name: 'Google Arazi (Fiziki)', url: 'http://mt0.google.com/vt/lyrs=p&hl=tr&x={x}&y={y}&z={z}', attribution: '&copy; Google' },
    { name: 'Esri Uydu (Orman Detay)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' },
    { name: 'Topografya (TopoMap)', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenTopoMap' }
  ];

  const renderFeature = (f: any, idx: number) => {
    const scale = currentZoom >= 18 ? 1 : Math.pow(2, currentZoom - 18);
    const showCard = false;

    let offsetLatLng: [number, number] | null = null;
    if (f.geoJson) {
      if (f.label === 'Toki Satış' || f.popupData) {
         try {
           const bounds = L.geoJSON(f.geoJson).getBounds();
           const ne = bounds.getNorthEast();
           offsetLatLng = [ne.lat, ne.lng]; // Sağ üst köşe
         } catch (e) {
           offsetLatLng = f.centroid || null;
         }
      } else if (f.isHatched && f.centroid) {
         offsetLatLng = [f.centroid[0] + 0.0003, f.centroid[1] + 0.0008];
      } else {
         offsetLatLng = f.centroid || null;
      }
    } else if (f.centroid) {
       offsetLatLng = f.centroid;
    }

    return (
      <React.Fragment key={idx}>
        <GeoJSON 
          data={f.geoJson} 
          pathOptions={{ 
            color: f.color, 
            weight: f.isHatched ? 2 : 3, 
            opacity: 0.8, 
            fillColor: f.isHatched ? 'url(#hatchPattern)' : f.color, 
            fillOpacity: f.isHatched ? 0.8 : 0.2 
          }} 
        >

          <Popup className="custom-map-popup">
            <div className="tooltip-content" style={{ margin: 0, padding: '4px', textAlign: 'center' }}>
              {f.isHatched ? (
                <>
                  <div className="tooltip-title" style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '4px' }}>Kesişen Alan</div>
                  {f.areaText && <div className="tooltip-desc" style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{f.areaText}</div>}
                </>
              ) : f.popupData ? (
                <>
                  <div className="tooltip-title" style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '2px' }}>{f.label}</div>
                  <div className="tooltip-desc" style={{ fontWeight: 700, fontSize: '14px', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', marginBottom: '4px' }}>{f.adaParsel}</div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', textAlign: 'left', paddingRight: '4px' }}>
                    {Object.entries(f.popupData).filter(([k,v]) => k !== 'geom' && k !== 'id' && k !== 'toplamalan(m2)' && v != null && String(v).trim() !== '').map(([k,v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280', fontWeight: 600, marginRight: '12px' }}>{k}</span>
                        <span style={{ color: '#111827', fontWeight: 500, textAlign: 'right' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {f.label && <div className="tooltip-title" style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', marginBottom: '2px' }}>{f.label}</div>}
                  {f.adaParsel && <div className="tooltip-desc" style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{f.adaParsel}</div>}
                  {f.areaText && <div className="tooltip-area" style={{ marginTop: '6px', fontSize: '11px', fontWeight: 600, color: '#4b5563', padding: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>{f.areaText}</div>}
                </>
              )}
            </div>
          </Popup>
        </GeoJSON>
        
        {offsetLatLng && (
          <>
            {showCard ? (
              <>
                {f.isHatched && <Polyline positions={[f.centroid!, offsetLatLng]} color="#3b82f6" weight={2} dashArray="4" />}
                <Marker 
                  position={offsetLatLng} 
                  icon={L.divIcon({ 
                    className: 'area-label-icon', 
                    html: `
                      <div class="area-text-box" style="transform: scale(${scale}); transform-origin: ${f.popupData ? 'top right' : (f.isHatched ? 'top left' : 'center center')}; transition: transform 0.2s ease; border-color: ${f.color}; color: ${f.color}; ${f.popupData ? 'background: rgba(255,255,255,0.95); min-width: 180px;' : ''}">
                        <span style="font-size: 9px; color: #6b7280; text-transform: uppercase; font-weight: bold;">${f.label || (f.isHatched ? 'Kesişen Alan' : '')}</span>
                        <strong style="display: block; font-size: 12px; color: #111827; margin-top: 1px; ${f.popupData ? 'border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 4px;' : ''}">${f.adaParsel || ''}</strong>
                        ${f.areaText && !f.popupData ? `<div style="font-size: 10px; margin-top: 2px;">${f.areaText}</div>` : ''}
                        ${f.popupData ? Object.entries(f.popupData).filter(([k,v]) => ['imardurumu', 'tapualan', 'toplamalan(m2)', 'tokihissesi(m2)', 'muhammenbedel', 'satisbedeli'].includes(k.toLowerCase()) && v != null && String(v).trim() !== '').map(([k,v]) => `<div style="display:flex; justify-content:space-between; font-size:9px; margin-bottom:1px; line-height: 1.1;"><span style="color:#6b7280; margin-right:6px;">${k.substring(0,8).toUpperCase()}</span><span style="color:#111827; font-weight:500; text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:120px;">${v}</span></div>`).join('') : ''}
                      </div>`,
                    iconSize: [100, 32]
                  })} 
                />
              </>
            ) : (
              <Marker 
                position={f.centroid!} 
                icon={L.divIcon({ 
                  className: 'custom-small-pin', 
                  html: `<div style="width: 14px; height: 14px; background: ${f.color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: scale(${Math.max(0.3, currentZoom / 15)}); transform-origin: center;"></div>`,
                  iconSize: [14, 14],
                  iconAnchor: [7, 7]
                })} 
              />
            )}
          </>
        )}
      </React.Fragment>
    );
  };

  // Group features
  const tescilliFeatures = parsedFeatures.filter(f => f.label === 'Tescilli THA');
  const mukerrerFeatures = parsedFeatures.filter(f => f.label === 'Mükerrer Parsel');
  const thaMukerrerFeatures = parsedFeatures.filter(f => f.label === 'THA (Mükerrer Tablo)');
  const tokiFeatures = parsedFeatures.filter(f => f.label === 'Toki Satış');
  const kesisenFeatures = parsedFeatures.filter(f => f.isHatched);

  return (
    <div 
      ref={panelRef} 
      className={`right-panel-map ${isOpen ? 'open' : ''}`}
    >
      <div className="panel-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 style={{ margin: 0, lineHeight: 1 }}>Harita Görünümü</h3>
          {titleInfo && <span style={{ fontSize: '13px', color: '#ffffff', opacity: 0.9, fontWeight: 500, lineHeight: 1.2 }}>{titleInfo}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '-2px' }}>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className={`map-container ${showLayers ? 'layers-open' : 'layers-closed'}`}>
        {isOpen && (
          <MapContainer 
            center={[39.92077, 32.85411]} 
            zoom={6} 
            maxZoom={22}
            zoomDelta={0.5}
            zoomSnap={0.5}
            style={{ height: '100%', width: '100%' }}
          >
            <BaseLayerTracker onBaseLayerChange={setActiveBaseLayer} />
            <svg style={{ width: 0, height: 0, position: 'absolute' }}>
              <defs>
                <pattern id="hatchPattern" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#3b82f6" strokeWidth="4" />
                </pattern>
              </defs>
            </svg>
            <MapController focusFeatures={parsedFocusFeatures} />
            <ZoomTracker onZoomChange={handleZoomChange} />
            <div className="zoom-indicator" style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#374151', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', zIndex: 1000, border: '1px solid rgba(0,0,0,0.1)' }}>
              Zoom: {currentZoom.toFixed(1)}
            </div>

            <LayersControl position="topright" collapsed={false}>
              {baseLayersData.map((layer) => (
                <LayersControl.BaseLayer key={layer.name} checked={activeBaseLayer === layer.name} name={layer.name}>
                  <TileLayer url={layer.url} attribution={layer.attribution} maxNativeZoom={18} maxZoom={22} />
                </LayersControl.BaseLayer>
              ))}
              {tescilliFeatures.length > 0 && (
                <LayersControl.Overlay checked name="<span class='layer-lbl' data-color='#16a34a' style='color: #16a34a; font-weight: 600;'>Tescilli THA</span>">
                  <LayerGroup>
                    {tescilliFeatures.map((f, i) => renderFeature(f, i))}
                  </LayerGroup>
                </LayersControl.Overlay>
              )}
              {mukerrerFeatures.length > 0 && (
                <LayersControl.Overlay checked name="<span class='layer-lbl' data-color='#9333ea' style='color: #9333ea; font-weight: 600;'>Mükerrer Parsel</span>">
                  <LayerGroup>
                    {mukerrerFeatures.map((f, i) => renderFeature(f, i))}
                  </LayerGroup>
                </LayersControl.Overlay>
              )}
              {thaMukerrerFeatures.length > 0 && (
                <LayersControl.Overlay name="<span class='layer-lbl' data-color='#ea580c' style='color: #ea580c; font-weight: 600;'>THA (Mükerrer Tablo)</span>">
                  <LayerGroup>
                    {thaMukerrerFeatures.map((f, i) => renderFeature(f, i))}
                  </LayerGroup>
                </LayersControl.Overlay>
              )}
              {tokiFeatures.length > 0 && (
                <LayersControl.Overlay checked name="<span class='layer-lbl' data-color='#eab308' style='color: #eab308; font-weight: 600;'>Toki Satış</span>">
                  <LayerGroup>
                    {tokiFeatures.map((f, i) => renderFeature(f, i))}
                  </LayerGroup>
                </LayersControl.Overlay>
              )}
              {kesisenFeatures.length > 0 && (
                <LayersControl.Overlay checked name="<span class='layer-lbl' data-color='#3b82f6' style='color: #3b82f6; font-weight: 600;'>Kesişen Alan</span>">
                  <LayerGroup>
                    {kesisenFeatures.map((f, i) => renderFeature(f, i))}
                  </LayerGroup>
                </LayersControl.Overlay>
              )}
            </LayersControl>
          </MapContainer>
        )}
        <button 
          className="mobile-layers-toggle-btn"
          onClick={() => setShowLayers(!showLayers)}
          title="Katmanları Göster/Gizle"
        >
          <Layers size={22} />
        </button>

      </div>
    </div>
  );
};

export default RightPanelMap;
