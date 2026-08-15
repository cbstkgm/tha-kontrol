import { useState, useMemo, useEffect, useCallback } from 'react';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Database, Info, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import './DataTable.css';

interface DataTableProps {
  type: 'tha' | 'mukerrer';
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

const DataTable: React.FC<DataTableProps> = ({ type, data, checkedRowIds, onRowCheck, mobileViewMode = 'card', totalDataLength, lastUpdateDate }) => {
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isReadyToRender, setIsReadyToRender] = useState(false);
  const [showMobileDateTooltip, setShowMobileDateTooltip] = useState(false);
  const [showVisitorTooltip, setShowVisitorTooltip] = useState(false);
  const [visitorCount] = useState("0");

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

  const totalPages = Math.ceil(data.length / pageSize);

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
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
    }
    return sortableItems;
  }, [data, sortConfig]);

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
    const cols = type === 'tha' ? thaColumns : mukerrerColumns;
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
    const fileName = type === 'tha' ? 'tescil_edilen_thalar.xlsx' : 'mukerrer_parseller.xlsx';
    XLSX.writeFile(workbook, fileName);
  }, [data, type]);

  useEffect(() => {
    window.addEventListener('export-excel', handleExportExcel);
    return () => window.removeEventListener('export-excel', handleExportExcel);
  }, [handleExportExcel]);

  const columns = type === 'tha' ? thaColumns : mukerrerColumns;

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
              : 'Mükerrer Parsel kayıtları işleniyor ve tablo oluşturuluyor.'}
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
        <div className="table-title">
          <h3>{type === 'tha' ? "Tescil Edilen THA'lar" : "Mükerrer Parseller"}</h3>
          <span className="badge">{data.length} Kayıt</span>
        </div>

        <div className="table-header-actions">
          <button className="export-excel-btn" onClick={handleExportExcel} title="Excel Olarak İndir">
            <Download size={16} />
            <span className="export-text">Excel İndir</span>
          </button>

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
              } else {
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

                      return <td key={col.key}>{val}</td>;
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
