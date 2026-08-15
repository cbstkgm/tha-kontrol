import { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import DataUploader from './components/DataUploader';
import DataTable from './components/DataTable';
import RightPanelMap, { type MapFeature } from './components/RightPanelMap';
import SqlModal from './components/SqlModal';
import * as turf from '@turf/turf';
import { parse } from 'wellknown';
import { parseCSVString } from './utils/dataParsers';
import type { ThaRecord, MukerrerRecord, ViewTab } from './types';
import './App.css';

export const THA_CSV_FILENAME = 'Tescil_THA_14.08.2026.csv';
export const MUKERRER_CSV_FILENAME = 'MukerrerParseller_14.08.2026.csv';



const getWktArea = (wkt: string | undefined): string | undefined => {
  if (!wkt) return undefined;
  try {
    const geo = parse(wkt);
    if (geo) {
      const area = turf.area(turf.feature(geo as any));
      return `${Math.round(area).toLocaleString('tr-TR')} m²`;
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
};

const getWktCentroid = (wkt: string | undefined): [number, number] | undefined => {
  if (!wkt) return undefined;
  try {
    const geo = parse(wkt);
    if (geo) {
      const center = turf.centroid(turf.feature(geo as any));
      return [center.geometry.coordinates[1], center.geometry.coordinates[0]];
    }
  } catch (e) { }
  return undefined;
};

function App() {

  const [activeTab, setActiveTab] = useState<ViewTab>('mukerrer');
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'table'>('card');

  const [thaData, setThaData] = useState<ThaRecord[]>([]);
  const [mukerrerData, setMukerrerData] = useState<MukerrerRecord[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>([]);
  const [checkedRowIds, setCheckedRowIds] = useState<Set<string>>(new Set());
  const [isMapPanelOpen, setIsMapPanelOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Load default datasets
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const [thaRes, mukerrerRes] = await Promise.all([
          fetch(import.meta.env.BASE_URL + THA_CSV_FILENAME),
          fetch(import.meta.env.BASE_URL + MUKERRER_CSV_FILENAME)
        ]);

        if (thaRes.ok) {
          const thaText = await thaRes.text();
          const parsedTha = await parseCSVString<ThaRecord>(thaText);
          const dataWithIds = parsedTha.map((row, i) => ({ ...row, id: `tha-${i}` }));
          setThaData(dataWithIds);
        }

        if (mukerrerRes.ok) {
          const mukerrerText = await mukerrerRes.text();
          const parsedMukerrer = await parseCSVString<MukerrerRecord>(mukerrerText);
          const dataWithIds = parsedMukerrer.map((row, i) => ({ ...row, id: `muk-${i}` }));
          setMukerrerData(dataWithIds);
        }
      } catch (err) {
        console.error("Default veri yüklenemedi", err);
      }
    };

    loadDefaults();
  }, []);

  const normalizeSearch = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/\s*([/-])\s*/g, '$1');

  const filteredThaData = useMemo(() => {
    if (!searchQuery) return thaData;
    const normalizedQuery = normalizeSearch(searchQuery);
    return thaData.filter(row => {
      const locString = normalizeSearch(`${row.ilad || ''}/${row.ilcead || ''}-${row.mahallead || ''}`);
      if (locString.includes(normalizedQuery)) return true;

      return Object.entries(row).some(([key, val]) => {
        const k = key.toLowerCase();
        return !k.includes('geom') && !k.includes('tarih') && !k.includes('yevmiye') && val != null && normalizeSearch(String(val)).includes(normalizedQuery);
      });
    });
  }, [thaData, searchQuery]);

  const filteredMukerrerData = useMemo(() => {
    if (!searchQuery) return mukerrerData;
    const normalizedQuery = normalizeSearch(searchQuery);
    return mukerrerData.filter(row => {
      const locString = normalizeSearch(`${row.ilad || ''}/${row.ilcead || ''}-${row.mahallead || ''}`);
      if (locString.includes(normalizedQuery)) return true;

      return Object.entries(row).some(([key, val]) => {
        const k = key.toLowerCase();
        return !k.includes('geom') && !k.includes('tarih') && !k.includes('yevmiye') && val != null && normalizeSearch(String(val)).includes(normalizedQuery);
      });
    });
  }, [mukerrerData, searchQuery]);



  const handleRowCheck = (row: any, checked: boolean) => {
    const rowKey = String(row.id);
    const newChecked = new Set<string>();
    if (checked) {
      newChecked.add(rowKey);
      setIsMapPanelOpen(true);
    } else {
      setIsMapPanelOpen(false);
    }
    setCheckedRowIds(newChecked);
  };



  useEffect(() => {
    if (checkedRowIds.size === 0) {
      setMapFeatures([]);
      return;
    }

    let features: MapFeature[] = [];
    const currentData = activeTab === 'tha' ? thaData : mukerrerData;

    checkedRowIds.forEach(rowId => {
      const row = currentData.find((r: any) => String(r.id) === rowId) as any;
      if (!row) return;

      if (activeTab === 'tha') {
        if (row.geom) {
          try {
            if (parse(row.geom)) {
              features.push({ wkt: row.geom, color: '#16a34a', label: 'Tescilli THA', adaParsel: `${row.adano}/${row.parselno}`, areaText: getWktArea(row.geom), centroid: getWktCentroid(row.geom) }); // Green for THA
            } else { console.warn(`Tescilli THA geometri bozuk/eksik: ${row.id}`); }
          } catch (e) { console.warn(`Tescilli THA parse edilemedi: ${row.id}`); }
        }

        // Find matching mukerrer geometries
        const match = mukerrerData.filter(m => String(m.tha_ihdas_adano).trim() === String(row.adano).trim() && String(m.tha_ihdas_parselno).trim() === String(row.parselno).trim());
        match.forEach(m => {
          if (m.mukerrer_parsel_geom) {
            try {
              if (parse(m.mukerrer_parsel_geom)) {
                features.push({ wkt: m.mukerrer_parsel_geom, color: '#9333ea', label: 'Mükerrer Parsel', adaParsel: `${m.mukerrer_adano}/${m.mukerrer_parselno}`, areaText: getWktArea(m.mukerrer_parsel_geom), centroid: getWktCentroid(m.mukerrer_parsel_geom) });

                const geo1 = parse(row.geom);
                const geo2 = parse(m.mukerrer_parsel_geom);
                if (geo1 && geo2) {
                  const poly1 = turf.feature(geo1 as any);
                  const poly2 = turf.feature(geo2 as any);
                  const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));
                  if (intersection) {
                    const center = turf.centroid(intersection);
                    const displayArea = m.kesisen_alan_m2 != null && String(m.kesisen_alan_m2).trim() !== ''
                      ? `${Number(m.kesisen_alan_m2).toLocaleString('tr-TR')} m²`
                      : `${Math.round(turf.area(intersection)).toLocaleString('tr-TR')} m²`;

                    features.push({
                      geoJson: intersection.geometry,
                      color: '#3b82f6',
                      isHatched: true,
                      areaText: displayArea,
                      centroid: [center.geometry.coordinates[1], center.geometry.coordinates[0]] as [number, number]
                    });
                  }
                }
              } else { console.warn(`Mükerrer geometri bozuk/eksik: ${m.id}`); }
            } catch (e) { console.warn(`Mükerrer geometri parse edilemedi: ${m.id}`); }
          }
        });
      } else if (activeTab === 'mukerrer') {
        let mukerrerWkt = row.mukerrer_parsel_geom;
        let thaWkt = row.tha_geom;
        let tescilliThaWkt = null;

        if (mukerrerWkt) {
          try {
            if (parse(mukerrerWkt)) {
              features.push({ wkt: mukerrerWkt, color: '#9333ea', label: 'Mükerrer Parsel', adaParsel: `${row.mukerrer_adano}/${row.mukerrer_parselno}`, areaText: getWktArea(mukerrerWkt), centroid: getWktCentroid(mukerrerWkt) }); // Purple for Mukerrer
            } else { console.warn(`Mükerrer geometri bozuk/eksik: ${row.id}`); }
          } catch (e) { console.warn(`Mükerrer geometri parse edilemedi: ${row.id}`); }
        }

        if (thaWkt) {
          try {
            if (parse(thaWkt)) {
              features.push({ wkt: thaWkt, color: '#ea580c', label: 'THA (Mükerrer Tablo)', adaParsel: `${row.tha_ihdas_adano}/${row.tha_ihdas_parselno}`, areaText: getWktArea(thaWkt), centroid: getWktCentroid(thaWkt) });
            }
          } catch (e) { }
        }

        // Tescilli THA sayfasından da bulmayı dene
        const match = thaData.find(t => String(t.adano).trim() === String(row.tha_ihdas_adano).trim() && String(t.parselno).trim() === String(row.tha_ihdas_parselno).trim());
        if (match && match.geom) {
          tescilliThaWkt = match.geom;
          try {
            if (parse(tescilliThaWkt)) {
              features.push({ wkt: tescilliThaWkt, color: '#16a34a', label: 'Tescilli THA', adaParsel: `${match.adano}/${match.parselno}`, areaText: getWktArea(tescilliThaWkt), centroid: getWktCentroid(tescilliThaWkt) }); // Green for THA
            }
          } catch (e) { }
        }

        let intersectionTargetWkt = tescilliThaWkt || thaWkt;

        // Compute Intersection
        if (mukerrerWkt && intersectionTargetWkt) {
          try {
            const geo1 = parse(mukerrerWkt);
            const geo2 = parse(intersectionTargetWkt);
            if (geo1 && geo2) {
              const poly1 = turf.feature(geo1 as any);
              const poly2 = turf.feature(geo2 as any);
              const intersection = turf.intersect(turf.featureCollection([poly1, poly2]));
              if (intersection) {
                const center = turf.centroid(intersection);
                const displayArea = row.kesisen_alan_m2 != null && String(row.kesisen_alan_m2).trim() !== ''
                  ? `${Number(row.kesisen_alan_m2).toLocaleString('tr-TR')} m²`
                  : `${Math.round(turf.area(intersection)).toLocaleString('tr-TR')} m²`;

                features.push({
                  geoJson: intersection.geometry,
                  color: '#3b82f6',
                  isHatched: true,
                  areaText: displayArea,
                  centroid: [center.geometry.coordinates[1], center.geometry.coordinates[0]] as [number, number]
                });
              }
            }
          } catch (e) {
            console.error("Intersection failed", e);
          }
        }


      }
    });

    setMapFeatures(features);
  }, [checkedRowIds, activeTab, thaData, mukerrerData]);

  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab);
    setIsMapPanelOpen(false);
    setMapFeatures([]);
    setCheckedRowIds(new Set());
  };

  return (
    <div className="app-container">
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        searchQuery={searchInput}
        setSearchQuery={setSearchInput}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        mobileViewMode={mobileViewMode}
        setMobileViewMode={setMobileViewMode}
      />

      <main className="main-content">
        <div className="content-area">
          {activeTab === 'upload' && (
            <DataUploader
              onThaUpload={(data) => { setThaData(data); setActiveTab('tha'); }}
              onMukerrerUpload={(data) => { setMukerrerData(data); setActiveTab('mukerrer'); }}
            />
          )}

          {activeTab === 'tha' && (
            <DataTable
              type="tha"
              data={filteredThaData}
              totalDataLength={thaData.length}
              checkedRowIds={checkedRowIds}
              onRowCheck={handleRowCheck}
              mobileViewMode={mobileViewMode}
            />
          )}

          {activeTab === 'mukerrer' && (
            <DataTable
              type="mukerrer"
              data={filteredMukerrerData}
              totalDataLength={mukerrerData.length}
              checkedRowIds={checkedRowIds}
              onRowCheck={handleRowCheck}
              mobileViewMode={mobileViewMode}
            />
          )}
        </div>

        <RightPanelMap
          isOpen={isMapPanelOpen}
          features={mapFeatures}
          focusFeatures={mapFeatures}
          onClose={() => {
            setIsMapPanelOpen(false);
            setCheckedRowIds(new Set());
          }}
        />
      </main>

      <SqlModal isOpen={isSqlModalOpen} onClose={() => setIsSqlModalOpen(false)} />
    </div>
  );
}

export default App;
