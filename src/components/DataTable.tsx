import { useState, useMemo, useEffect, useCallback } from 'react';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Database, Info, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import './DataTable.css';

interface DataTableProps {
  type: 'tha' | 'mukerrer' | 'toki';
  data: any[];
  checkedRowIds: Set<string>;
  onRowCheck: (row: any, checked: boolean) => void;

  mobileViewMode?: 'card' | 'table';
  totalDataLength?: number;
  lastUpdateDate?: string;
}

const mukerrerColumns = [
  { key: 'ilad', label: 'İl' },
  { key: 'ilcead', label: 'İlçe' },
  { key: 'mahallead', label: 'Mahalle' },
  { key: 'tha_ihdas_adano', label: 'THA Ada' },
  { key: 'tha_ihdas_parselno', label: 'THA Parsel' },
  { key: 'mukerrer_adano', label: 'Mükerrer Ada' },
  { key: 'mukerrer_parselno', label: 'Mükerrer Parsel' },
  { key: 'kesisen_alan_m2', label: 'Kesişen Alan (m²)' },
  { key: 'islemtanimad', label: 'İşlem Adı' },
  { key: 'kad_basvuruno', label: 'Kad. Başvuru No' },
  { key: 'kad_basvuru_olusturmatarihi', label: 'Kad. Başvuru Tarihi' },
  { key: 'kad_fenkayitno', label: 'Kad. Fen Kayıt No' },
  { key: 'kad_fenkayittarih', label: 'Kad. Fen Kayıt Tarihi' },
  { key: 'basvuru_asama_durum', label: 'Aşama Durumu' },
  { key: 'tescilyevmiyeno', label: 'Tescil Yevmiye No' },
  { key: 'tesciltarih', label: 'Tescil Tarihi' },
  { key: 'olusanparselid', label: 'Oluşan Parsel ID' },
  { key: 'mukerrer_parsel_durum', label: 'Durum' },
  { key: 'mukerrer_parsel_onaydurum', label: 'Onay Durumu' }
];

const thaColumns = [
  { key: 'ilad', label: 'İl' },
  { key: 'ilcead', label: 'İlçe' },
  { key: 'mahallead', label: 'Mahalle' },
  { key: 'adano', label: 'Ada No' },
  { key: 'parselno', label: 'Parsel No' },
  { key: 'yuzolcum', label: 'Yüzölçüm' },
  { key: 'islemtanimad', label: 'İşlem Adı' },
  { key: 'kad_basvuruno', label: 'Kad. Başvuru No' },
  { key: 'kad_basvurualinmatarihi', label: 'Kad. Başvuru Tarihi' },
  { key: 'kad_fenkayitno', label: 'Kad. Fen Kayıt No' },
  { key: 'kad_fenkayittarih', label: 'Kad. Fen Kayıt Tarihi' },
  { key: 'basvuru_asama_durum', label: 'Aşama Durumu' },
  { key: 'tapu_tesciltarih', label: 'Tescil Tarihi' },
  { key: 'tapu_tescilyevmiyeno', label: 'Tescil Yevmiye No' }
];

const tokiColumns = [
  { key: 'ilad', label: 'İl' },
  { key: 'ilcead', label: 'İlçe' },
  { key: 'mahallead', label: 'Mahalle' },
  { key: 'adano', label: 'Ada No' },
  { key: 'parselno', label: 'Parsel No' },
  { key: 'tapualan', label: 'Tapu Alan (m²)' },

  { key: 'tokihissesi(m2)', label: 'Toki Hissesi (m²)' },
  { key: 'imardurumu', label: 'İmar Durumu' },
  { key: 'muhammenbedel', label: 'Muhammen Bedel' },
  { key: 'satisbedeli', label: 'Satış Bedeli' },
];

const DataTable: React.FC<DataTableProps> = ({ type, data, checkedRowIds, onRowCheck, mobileViewMode = 'card', totalDataLength, lastUpdateDate }) => {
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isReadyToRender, setIsReadyToRender] = useState(false);
  const [showMobileDateTooltip, setShowMobileDateTooltip] = useState(false);
  const [showVisitorTooltip, setShowVisitorTooltip] = useState(false);
  const [visitorCount, setVisitorCount] = useState("...");

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('has_visited');
    const endpoint = hasVisited 
      ? 'https://countapi.mileshilliard.com/api/v1/get/cbstkgm-tha-kontrol-visitor-count'
      : 'https://countapi.mileshilliard.com/api/v1/hit/cbstkgm-tha-kontrol-visitor-count';
      
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (data && data.value !== undefined) {
          setVisitorCount(data.value.toLocaleString('tr-TR'));
          if (!hasVisited) sessionStorage.setItem('has_visited', 'true');
        }
      })
      .catch(err => console.error('Sayaç yüklenemedi:', err));
  }, []);

  useEffect(() => {
    const dataLen = totalDataLength !== undefined ? totalDataLength : data.length;
    if (dataLen === 0) {
      setLoadingProgress(0);
      setIsReadyToRender(false);
    } else if (!isReadyToRender) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsReadyToRender(true), 250);
            return 100;
          }
          return prev + (Math.random() * 8 + 4);
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [totalDataLength, data.length, isReadyToRender]);

  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const [satildiChecked, setSatildiChecked] = useState(true);
  const [satilmadiChecked, setSatilmadiChecked] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        const availableHeight = window.innerHeight - 280;
        const rowHeight = 44;
        const calcSize = Math.max(3, Math.floor(availableHeight / rowHeight) - 1);
        setPageSize(calcSize);
      } else {
        setPageSize(prev => (prev < 20 ? 20 : prev));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredData = useMemo(() => {
    if (type !== 'toki') return data;
    return data.filter(row => {
      const isSatisBedeliDolu = row['satisbedeli'] !== undefined && row['satisbedeli'] !== null && String(row['satisbedeli']).trim() !== '' && String(row['satisbedeli']).trim() !== '-';
      
      if (satildiChecked && satilmadiChecked) return true;
      if (!satildiChecked && !satilmadiChecked) return false;
      
      if (satildiChecked && isSatisBedeliDolu) return true;
      if (satilmadiChecked && !isSatisBedeliDolu) return true;
      
      return false;
    });
  }, [data, type, satildiChecked, satilmadiChecked]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const totalSatisBedeli = useMemo(() => {
    if (type !== 'toki') return 0;
    return filteredData.reduce((acc, row) => {
      let val = row['satisbedeli'] ?? row['satis_bedeli'];
      if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-') {
        const numVal = Number(String(val).replace(',', '.'));
        if (!isNaN(numVal)) {
          return acc + numVal;
        }
      }
      return acc;
    }, 0);
  }, [filteredData, type]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if ((sortConfig.key === 'tesciltarih' || sortConfig.key === 'tapu_tesciltarih') && (aValue === undefined || aValue === null || aValue === '')) aValue = a['tesciltarih'] ?? a['tapu_tesciltarih'] ?? a['taputesciltarih'] ?? aValue;
        if ((sortConfig.key === 'tesciltarih' || sortConfig.key === 'tapu_tesciltarih') && (bValue === undefined || bValue === null || bValue === '')) bValue = b['tesciltarih'] ?? b['tapu_tesciltarih'] ?? b['taputesciltarih'] ?? bValue;
        if ((sortConfig.key === 'tescilyevmiyeno' || sortConfig.key === 'tapu_tescilyevmiyeno') && (aValue === undefined || aValue === null || aValue === '')) aValue = a['tescilyevmiyeno'] ?? a['tapu_tescilyevmiyeno'] ?? a['taputescilyevmiyeno'] ?? a['yevmiyeno'] ?? aValue;
        if ((sortConfig.key === 'tescilyevmiyeno' || sortConfig.key === 'tapu_tescilyevmiyeno') && (bValue === undefined || bValue === null || bValue === '')) bValue = b['tescilyevmiyeno'] ?? b['tapu_tescilyevmiyeno'] ?? b['taputescilyevmiyeno'] ?? b['yevmiyeno'] ?? bValue;

        if (type === 'tha' && ['tesciltarih', 'tapu_tesciltarih', 'tescilyevmiyeno', 'tapu_tescilyevmiyeno'].includes(sortConfig.key)) {
           const aStatus = (a['basvuru_asama_durum'] || '').toString().toLowerCase().trim();
           const bStatus = (b['basvuru_asama_durum'] || '').toString().toLowerCase().trim();
           const allowed = ['onaylandı', 'onaylandi', 'tescilden geldi', 'onay bekliyor', 'tamamlandı', 'tamamlandi'];
           if (!allowed.includes(aStatus)) aValue = '';
           if (!allowed.includes(bStatus)) bValue = '';
        }

        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        const aNum = Number(aValue);
        const bNum = Number(bValue);
        if (!isNaN(aNum) && !isNaN(bNum) && String(aValue).trim() !== '' && String(bValue).trim() !== '') {
          aValue = aNum;
          bValue = bNum;
        } else {
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else {
      sortableItems.sort((a, b) => {
        const ilA = String(a.ilad || '').toLowerCase();
        const ilB = String(b.ilad || '').toLowerCase();
        if (ilA !== ilB) return ilA.localeCompare(ilB, 'tr');

        const ilceA = String(a.ilcead || '').toLowerCase();
        const ilceB = String(b.ilcead || '').toLowerCase();
        if (ilceA !== ilceB) return ilceA.localeCompare(ilceB, 'tr');

        const mahA = String(a.mahallead || '').toLowerCase();
        const mahB = String(b.mahallead || '').toLowerCase();
        if (mahA !== mahB) return mahA.localeCompare(mahB, 'tr');

        const adaAKey = type === 'mukerrer' ? 'tha_ihdas_adano' : 'adano';
        const adaAVal = a[adaAKey];
        const adaBVal = b[adaAKey];
        const adaNumA = Number(adaAVal);
        const adaNumB = Number(adaBVal);
        
        if (!isNaN(adaNumA) && !isNaN(adaNumB) && String(adaAVal).trim() !== '' && String(adaBVal).trim() !== '') {
            if (adaNumA !== adaNumB) return adaNumA - adaNumB;
        } else {
            const sA = String(adaAVal || '').toLowerCase();
            const sB = String(adaBVal || '').toLowerCase();
            if (sA !== sB) return sA.localeCompare(sB, 'tr');
        }

        const parselAKey = type === 'mukerrer' ? 'tha_ihdas_parselno' : 'parselno';
        const parselAVal = a[parselAKey];
        const parselBVal = b[parselAKey];
        const parselNumA = Number(parselAVal);
        const parselNumB = Number(parselBVal);
        
        if (!isNaN(parselNumA) && !isNaN(parselNumB) && String(parselAVal).trim() !== '' && String(parselBVal).trim() !== '') {
            if (parselNumA !== parselNumB) return parselNumA - parselNumB;
        } else {
            const sA = String(parselAVal || '').toLowerCase();
            const sB = String(parselBVal || '').toLowerCase();
            if (sA !== sB) return sA.localeCompare(sB, 'tr');
        }

        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const currentData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (row: any, idx: number) => {
    const geomStr = row.mukerrer_parsel_geom || row.tha_geom || row.geom;
    if (!geomStr) return;

    const globalIdx = (currentPage - 1) * pageSize + idx;
    const rowKey = String(row.id || globalIdx);
    const isChecked = checkedRowIds.has(rowKey);

    onRowCheck(row, !isChecked);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleExportExcel = useCallback(() => {
    const cols = type === 'tha' ? thaColumns : (type === 'mukerrer' ? mukerrerColumns : tokiColumns);
    const exportData = data.map(row => {
      const newRow: any = {};
      cols.forEach(col => {
        let val = row[col.key];
        if ((col.key === 'tesciltarih' || col.key === 'tapu_tesciltarih') && (val === undefined || val === null || val === '')) {
          val = row['tesciltarih'] ?? row['tapu_tesciltarih'] ?? row['taputesciltarih'] ?? val;
        }
        if ((col.key === 'tescilyevmiyeno' || col.key === 'tapu_tescilyevmiyeno') && (val === undefined || val === null || val === '')) {
          val = row['tescilyevmiyeno'] ?? row['tapu_tescilyevmiyeno'] ?? row['taputescilyevmiyeno'] ?? row['yevmiyeno'] ?? val;
        }

        if (type === 'tha' && ['tesciltarih', 'tapu_tesciltarih', 'tescilyevmiyeno', 'tapu_tescilyevmiyeno'].includes(col.key)) {
          const status = (row['basvuru_asama_durum'] || '').toString().toLowerCase().trim();
          const allowed = ['onaylandı', 'onaylandi', 'tescilden geldi', 'onay bekliyor', 'tamamlandı', 'tamamlandi'];
          if (!allowed.includes(status)) {
            val = '';
          }
        }
        newRow[col.label] = val;
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Veriler");
    const fileName = type === 'tha' ? 'tescil_edilen_thalar.xlsx' : (type === 'mukerrer' ? 'mukerrer_parseller.xlsx' : 'toki_satis.xlsx');
    XLSX.writeFile(workbook, fileName);
  }, [data, type]);

  const handleExportCSV = useCallback(() => {
    const cols = type === 'tha' ? thaColumns : (type === 'mukerrer' ? mukerrerColumns : tokiColumns);
    const exportData = data.map(row => {
      const newRow: any = {};
      cols.forEach(col => {
        let val = row[col.key];
        if ((col.key === 'tesciltarih' || col.key === 'tapu_tesciltarih') && (val === undefined || val === null || val === '')) {
          val = row['tesciltarih'] ?? row['tapu_tesciltarih'] ?? row['taputesciltarih'] ?? val;
        }
        if ((col.key === 'tescilyevmiyeno' || col.key === 'tapu_tescilyevmiyeno') && (val === undefined || val === null || val === '')) {
          val = row['tescilyevmiyeno'] ?? row['tapu_tescilyevmiyeno'] ?? row['taputescilyevmiyeno'] ?? row['yevmiyeno'] ?? val;
        }

        if (type === 'tha' && ['tesciltarih', 'tapu_tesciltarih', 'tescilyevmiyeno', 'tapu_tescilyevmiyeno'].includes(col.key)) {
          const status = (row['basvuru_asama_durum'] || '').toString().toLowerCase().trim();
          const allowed = ['onaylandı', 'onaylandi', 'tescilden geldi', 'onay bekliyor', 'tamamlandı', 'tamamlandi'];
          if (!allowed.includes(status)) {
            val = '';
          }
        }
        newRow[col.label] = val;
      });
      return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = type === 'tha' ? 'tescil_edilen_thalar.csv' : (type === 'mukerrer' ? 'mukerrer_parseller.csv' : 'toki_satis.csv');
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, type]);

  useEffect(() => {
    window.addEventListener('export-excel', handleExportExcel);
    window.addEventListener('export-csv', handleExportCSV);
    return () => {
      window.removeEventListener('export-excel', handleExportExcel);
      window.removeEventListener('export-csv', handleExportCSV);
    };
  }, [handleExportExcel, handleExportCSV]);

  const columns = type === 'tha' ? thaColumns : (type === 'mukerrer' ? mukerrerColumns : tokiColumns);

  if (!isReadyToRender && (totalDataLength === undefined || totalDataLength > 0)) {
    return (
      <div className={`data-table-container glass-panel ${isMobile && mobileViewMode === 'table' ? 'view-mode-table' : ''}`} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', padding: '40px 20px', textAlign: 'center' }}>
        <div className="loading-card glass-panel">
          <div className="loading-icon-wrapper">
            <Database size={48} className="pulse-icon text-blue" />
          </div>
          <h2 className="loading-title">Veriler Hazırlanıyor</h2>
          <p className="loading-desc">
            {type === 'tha' 
              ? 'Tescil edilen THA kayıtları işleniyor ve tablo oluşturuluyor.' 
              : type === 'mukerrer' 
              ? 'Mükerrer Parsel kayıtları işleniyor ve tablo oluşturuluyor.'
              : 'Toki Satış kayıtları işleniyor ve tablo oluşturuluyor.'}
            <br />
            Lütfen bekleyin...
          </p>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill real-time"
              style={{ width: `${Math.min(100, loadingProgress)}%` }}
            ></div>
          </div>
          <div className="loading-status-text">YÜKLENİYOR... {Math.round(Math.min(100, loadingProgress))}%</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`data-table-container glass-panel ${isMobile && mobileViewMode === 'table' ? 'view-mode-table' : ''}`}>
      <div className="table-header-controls">
        <div className="table-title" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3>{type === 'tha' ? "Tescil Edilen THA'lar" : (type === 'mukerrer' ? "Mükerrer Parseller" : "Toki Satış Kayıtları")}</h3>
            <span className="badge">{filteredData.length} Kayıt</span>
          </div>
          {type === 'toki' && !isMobile && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  <input type="checkbox" checked={satildiChecked} onChange={e => setSatildiChecked(e.target.checked)} style={{ cursor: 'pointer' }} />
                  Satıldı
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  <input type="checkbox" checked={satilmadiChecked} onChange={e => setSatilmadiChecked(e.target.checked)} style={{ cursor: 'pointer' }} />
                  Satılmadı
                </label>
              </div>
              
              {totalSatisBedeli > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Toplam Satış:</span>
                  <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 700 }}>
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalSatisBedeli)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="table-header-actions">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="export-excel-btn" onClick={handleExportExcel} title="Excel Olarak İndir">
              <Download size={16} />
              <span className="export-text">Excel İndir</span>
            </button>
            <button className="export-excel-btn" onClick={handleExportCSV} title="CSV Olarak İndir" style={{ background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <Download size={16} />
              <span className="export-text">CSV İndir</span>
            </button>
          </div>

          <div className="page-size-selector">
            <label>Kayıt Sayısı: </label>
            <select value={pageSize} onChange={handlePageSizeChange}>
              {isMobile && <option value={pageSize}>Otomatik ({pageSize})</option>}
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
      </div>

      {isMobile && type === 'toki' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>
              <input type="checkbox" checked={satildiChecked} onChange={e => setSatildiChecked(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              Satıldı
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0', fontWeight: '500' }}>
              <input type="checkbox" checked={satilmadiChecked} onChange={e => setSatilmadiChecked(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              Satılmadı
            </label>
          </div>
          {totalSatisBedeli > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 500 }}>Toplam Satış:</span>
              <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 600 }}>
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalSatisBedeli)}
              </span>
            </div>
          )}
        </div>
      )}
      <div className="table-wrapper">
        {isMobile && mobileViewMode === 'card' ? (
          <div className="mobile-card-list">
            {currentData.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Kayıt bulunamadı.</div>
            ) : currentData.map((row, idx) => {
              const rowKey = String(row.id || ((currentPage - 1) * pageSize + idx));
              const isRowActive = checkedRowIds.has(rowKey);
              const globalIdx = (currentPage - 1) * pageSize + idx + 1;

              if (type === 'mukerrer') {
                return (
                  <div key={rowKey} className={`mobile-card glass-panel ${isRowActive ? 'active' : ''}`} onClick={() => handleRowClick(row, idx)}>
                    <div className="mc-header">
                      <span className="mc-index">#{globalIdx}</span>
                      <span className="mc-badge mc-badge-green">Mükerrer</span>
                    </div>
                    <div className="mc-body">
                      <div className="mc-row">
                        <div className="mc-loc-text text-blue">
                          <strong>A:</strong> <span className="mc-loc-main">{row.ilad}/{row.ilcead}-</span><span className="mc-loc-sub">{row.mahallead}</span>
                        </div>
                        <span className="mc-badge-outline-blue">{row.tha_ihdas_adano}/{row.tha_ihdas_parselno}</span>
                      </div>
                      <div className="mc-row">
                        <div className="mc-loc-text text-green">
                          <strong>B:</strong> <span className="mc-loc-main">{row.ilad}/{row.ilcead}-</span><span className="mc-loc-sub">{row.mahallead}</span>
                        </div>
                        <span className="mc-badge-outline-green">{row.mukerrer_adano}/{row.mukerrer_parselno}</span>
                      </div>
                    </div>
                    
                    <div className="mc-details-grid">
                      {columns.filter(c => !['ilad', 'ilcead', 'mahallead', 'tha_ihdas_adano', 'tha_ihdas_parselno', 'mukerrer_adano', 'mukerrer_parselno', 'kesisen_alan_m2'].includes(c.key)).map(col => {
                        let val = row[col.key];
                        if ((col.key === 'tesciltarih' || col.key === 'tapu_tesciltarih') && (val === undefined || val === null || val === '')) {
                          val = row['tesciltarih'] ?? row['tapu_tesciltarih'] ?? row['taputesciltarih'] ?? val;
                        }
                        if ((col.key === 'tescilyevmiyeno' || col.key === 'tapu_tescilyevmiyeno') && (val === undefined || val === null || val === '')) {
                          val = row['tescilyevmiyeno'] ?? row['tapu_tescilyevmiyeno'] ?? row['taputescilyevmiyeno'] ?? row['yevmiyeno'] ?? val;
                        }
                        if (val === undefined || val === null || val === '') return null;
                        return (
                          <div className="mc-detail-item" key={col.key}>
                            <span className="mc-detail-label">{col.label}</span>
                            <span className="mc-detail-value" title={String(val)}>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mc-footer">
                      <span className="mc-footer-label">KESİŞİM</span>
                      <span className="mc-footer-value">{row.kesisen_alan_m2 ? `${row.kesisen_alan_m2} m²` : '-'}</span>
                    </div>
                  </div>
                );
              } else if (type === 'tha') {
                return (
                  <div key={rowKey} className={`mobile-card glass-panel ${isRowActive ? 'active' : ''}`} onClick={() => handleRowClick(row, idx)}>
                    <div className="mc-header">
                      <span className="mc-index">#{globalIdx}</span>
                      <span className="mc-badge mc-badge-green">Tescilli THA</span>
                    </div>
                    <div className="mc-body">
                      <div className="mc-row">
                        <div className="mc-loc-text text-blue">
                          <strong>A:</strong> <span className="mc-loc-main">{row.ilad}/{row.ilcead}-</span><span className="mc-loc-sub">{row.mahallead}</span>
                        </div>
                        <span className="mc-badge-outline-blue">{row.adano}/{row.parselno}</span>
                      </div>
                    </div>

                    <div className="mc-details-grid">
                      {columns.filter(c => !['ilad', 'ilcead', 'mahallead', 'adano', 'parselno', 'yuzolcum'].includes(c.key)).map(col => {
                        let val = row[col.key];
                        if ((col.key === 'tesciltarih' || col.key === 'tapu_tesciltarih') && (val === undefined || val === null || val === '')) {
                          val = row['tesciltarih'] ?? row['tapu_tesciltarih'] ?? row['taputesciltarih'] ?? val;
                        }
                        if ((col.key === 'tescilyevmiyeno' || col.key === 'tapu_tescilyevmiyeno') && (val === undefined || val === null || val === '')) {
                          val = row['tescilyevmiyeno'] ?? row['tapu_tescilyevmiyeno'] ?? row['taputescilyevmiyeno'] ?? row['yevmiyeno'] ?? val;
                        }
                        if (type === 'tha' && ['tesciltarih', 'tapu_tesciltarih', 'tescilyevmiyeno', 'tapu_tescilyevmiyeno'].includes(col.key)) {
                          const status = (row['basvuru_asama_durum'] || '').toString().toLowerCase().trim();
                          const allowed = ['onaylandı', 'onaylandi', 'tescilden geldi', 'onay bekliyor', 'tamamlandı', 'tamamlandi'];
                          if (!allowed.includes(status)) {
                            val = '';
                          }
                        }
                        if (val === undefined || val === null || val === '') return null;
                        return (
                          <div className="mc-detail-item" key={col.key}>
                            <span className="mc-detail-label">{col.label}</span>
                            <span className="mc-detail-value" title={String(val)}>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mc-footer">
                      <span className="mc-footer-label">YÜZÖLÇÜM</span>
                      <span className="mc-footer-value">{row.yuzolcum ? `${row.yuzolcum} m²` : '-'}</span>
                    </div>
                  </div>
                );
              } else {
                // toki kartı
                return (
                  <div key={rowKey} className={`mobile-card glass-panel ${isRowActive ? 'active' : ''}`} onClick={() => handleRowClick(row, idx)}>
                    <div className="mc-header">
                      <span className="mc-index">#{globalIdx}</span>
                      <span className="mc-badge" style={{ backgroundColor: '#eab308', color: '#fff' }}>Toki Satış</span>
                    </div>
                    <div className="mc-body">
                      <div className="mc-row">
                        <div className="mc-loc-text text-blue">
                          <span className="mc-loc-main">{row.ilad}/{row.ilcead}-</span><span className="mc-loc-sub">{row.mahallead}</span>
                        </div>
                        <span className="mc-badge-outline-blue">{row.adano}/{row.parselno}</span>
                      </div>
                    </div>

                    <div className="mc-details-grid">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {columns.filter(c => !['ilad', 'ilcead', 'mahallead', 'adano', 'parselno'].includes(c.key)).map(col => {
                          let val = row[col.key];
                          const isSatisBedeli = col.key === 'satisbedeli' || col.key === 'satis_bedeli';
                          const isFiyat = isSatisBedeli || col.key === 'muhammenbedel';
                          
                          if (isFiyat) return null;
                          if (val === undefined || val === null || val === '') return null;

                          return (
                            <div className="mc-detail-item" key={col.key}>
                              <span className="mc-detail-label">{col.label}</span>
                              <span className="mc-detail-value" title={String(val)}>{val}</span>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {columns.filter(c => !['ilad', 'ilcead', 'mahallead', 'adano', 'parselno'].includes(c.key)).map(col => {
                          let val = row[col.key];
                          const isSatisBedeli = col.key === 'satisbedeli' || col.key === 'satis_bedeli';
                          const isFiyat = isSatisBedeli || col.key === 'muhammenbedel';
                          
                          if (!isFiyat) return null;
                          if (!isSatisBedeli && (val === undefined || val === null || val === '')) return null;
                          if (val === undefined || val === null || val === '') val = '-';

                          const displayVal = (val !== '-' && !isNaN(Number(val))) 
                            ? new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(val)) 
                            : val;

                          return (
                            <div className="mc-detail-item" key={col.key}>
                              <span className="mc-detail-label" style={{ color: isSatisBedeli ? '#16a34a' : '#ef4444' }}>{col.label}</span>
                              <span className="mc-detail-value" title={String(val)} style={{ color: isSatisBedeli ? '#16a34a' : '#ef4444', fontWeight: 'bold' }}>
                                {displayVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="action-col" style={{ width: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <span>#</span>
                </th>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => requestSort(col.key)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    title="Sıralamak için tıklayın"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {col.label}
                      {sortConfig?.key === col.key && (
                        <span style={{ fontSize: '0.8em', color: 'var(--primary-color)' }}>
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : currentData.map((row, idx) => {
                const rowKey = String(row.id || ((currentPage - 1) * pageSize + idx));
                const isRowActive = checkedRowIds.has(rowKey);

                return (
                  <tr
                    key={rowKey}
                    className={isRowActive ? 'active-row' : ''}
                    onClick={() => handleRowClick(row, idx)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="action-col" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    {columns.map(col => {
                      let val = row[col.key];
                      if ((col.key === 'tesciltarih' || col.key === 'tapu_tesciltarih') && (val === undefined || val === null || val === '')) {
                        val = row['tesciltarih'] ?? row['tapu_tesciltarih'] ?? row['taputesciltarih'] ?? val;
                      }
                      if ((col.key === 'tescilyevmiyeno' || col.key === 'tapu_tescilyevmiyeno') && (val === undefined || val === null || val === '')) {
                        val = row['tescilyevmiyeno'] ?? row['tapu_tescilyevmiyeno'] ?? row['taputescilyevmiyeno'] ?? row['yevmiyeno'] ?? val;
                      }

                      if (type === 'tha' && ['tesciltarih', 'tapu_tesciltarih', 'tescilyevmiyeno', 'tapu_tescilyevmiyeno'].includes(col.key)) {
                        const status = (row['basvuru_asama_durum'] || '').toString().toLowerCase().trim();
                        const allowed = ['onaylandı', 'onaylandi', 'tescilden geldi', 'onay bekliyor', 'tamamlandı', 'tamamlandi'];
                        if (!allowed.includes(status)) {
                          val = '';
                        }
                      }

                      let displayVal = val;
                      const isSatisBedeli = col.key === 'satisbedeli' || col.key === 'satis_bedeli';
                      const isFiyat = isSatisBedeli || col.key === 'muhammenbedel';
                      
                      if (isFiyat && val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim() !== '-') {
                        const numVal = Number(String(val).replace(',', '.'));
                        if (!isNaN(numVal)) {
                          displayVal = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(numVal);
                        }
                      }
                      
                      return (
                        <td key={col.key} style={isSatisBedeli ? { color: '#16a34a', fontWeight: 500 } : undefined}>
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="table-footer" style={{ position: 'relative' }}>
        <div className="pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>
            {isMobile 
              ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, data.length)} / ${data.length}`
              : `Gösterilen: ${(currentPage - 1) * pageSize + 1} - ${Math.min(currentPage * pageSize, data.length)} / Toplam: ${data.length}`}
          </span>
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select 
                value={pageSize} 
                onChange={handlePageSizeChange}
                style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.7)', outline: 'none' }}
              >
                <option value={pageSize}>Oto ({pageSize})</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
              </select>
            </div>
          )}
        </div>

        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            position: isMobile ? 'static' : 'absolute', 
            left: '50%', 
            transform: isMobile ? 'none' : 'translateX(-50%)',
            order: isMobile ? 2 : 0,
            flex: isMobile ? '1' : 'none',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}
        >
          {lastUpdateDate && (
            <div 
              className="update-info" 
              onClick={() => { if (isMobile) { setShowMobileDateTooltip(!showMobileDateTooltip); setShowVisitorTooltip(false); } }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                color: 'var(--text-secondary)', 
                fontSize: '0.8rem', 
                cursor: isMobile ? 'pointer' : 'default',
                position: 'relative'
              }} 
              title={`Güncelleme Tarihi: ${lastUpdateDate}`}
            >
              <Info size={14} style={{ color: 'var(--primary-color)' }} />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>Güncelleme: {lastUpdateDate}</span>

              {showMobileDateTooltip && isMobile && (
                <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px', padding: '6px 12px', background: '#1e293b', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', zIndex: 1000, color: '#f8fafc', fontSize: '0.85rem', fontWeight: 500 }}>
                  Güncelleme: {lastUpdateDate}
                  <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1e293b' }} />
                </div>
              )}
            </div>
          )}

          <div 
            className="visitor-info"
            onClick={() => { if (isMobile) { setShowVisitorTooltip(!showVisitorTooltip); setShowMobileDateTooltip(false); } }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              color: 'var(--text-secondary)', 
              fontSize: '0.8rem', 
              cursor: isMobile ? 'pointer' : 'default',
              position: 'relative'
            }}
            title={`Ziyaretçi Sayısı: ${visitorCount}`}
          >
            <Users size={14} style={{ color: 'var(--primary-color)' }} />
            <span style={{ display: isMobile ? 'none' : 'inline' }}>Ziyaretçi: {visitorCount}</span>

            {showVisitorTooltip && isMobile && (
              <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px', padding: '6px 12px', background: '#1e293b', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', whiteSpace: 'nowrap', zIndex: 1000, color: '#f8fafc', fontSize: '0.85rem', fontWeight: 500 }}>
                Ziyaretçi: {visitorCount}
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1e293b' }} />
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls" style={{ order: isMobile ? 3 : 0 }}>
            <button disabled={currentPage === 1} onClick={() => goToPage(1)}><ChevronsLeft size={16} /></button>
            <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}><ChevronLeft size={16} /></button>
            <span className="page-indicator">
              {isMobile ? `${currentPage}/${totalPages}` : `Sayfa ${currentPage} / ${totalPages}`}
            </span>
            <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}><ChevronRight size={16} /></button>
            <button disabled={currentPage === totalPages} onClick={() => goToPage(totalPages)}><ChevronsRight size={16} /></button>
          </div>
        )}
      </div>

    </div>
  );
};

export default DataTable;
