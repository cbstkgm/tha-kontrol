import React, { useState, useRef, useEffect } from 'react';
import type { ViewTab } from '../types';
import { Database, Search, Code, Download, Menu, X, List, LayoutGrid } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import './Header.css';

interface HeaderProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenSqlModal?: () => void;
  mobileViewMode?: 'card' | 'table';
  setMobileViewMode?: (mode: 'card' | 'table') => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, searchQuery, setSearchQuery, onOpenSqlModal, mobileViewMode, setMobileViewMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.addEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="app-header glass-panel">
      <div className="header-logo">
        <AnimatedLogo direction="right" />
        <h1>Tescil Harici Alanlar</h1>
        <AnimatedLogo direction="left" />
      </div>

      <nav className="header-nav">
        <button
          className={`nav-btn ${activeTab === 'mukerrer' ? 'active' : ''}`}
          onClick={() => setActiveTab('mukerrer')}
        >
          <Database size={18} />
          Mükerrer Parseller
        </button>
        <button
          className={`nav-btn ${activeTab === 'tha' ? 'active' : ''}`}
          onClick={() => setActiveTab('tha')}
        >
          <Database size={18} />
          Tescil Edilen THA'lar
        </button>
        {/* Veri Yükleme alanını geçici olarak gizledik
        <button
          className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={18} />
          Veri Yükleme
        </button>
        */}
        <button
          className="nav-btn"
          onClick={onOpenSqlModal}
        >
          <Code size={18} />
          SQL Sorguları
        </button>
      </nav>

      <div className="header-actions">
        <div className="mobile-menu-container" ref={mobileMenuRef}>
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {isMobileMenuOpen && (
            <div className="mobile-dropdown-menu">
              <button
                className={`mobile-dropdown-item ${activeTab === 'mukerrer' ? 'active' : ''}`}
                onClick={() => { setActiveTab('mukerrer'); setIsMobileMenuOpen(false); }}
              >
                <Database size={16} />
                Mükerrer Parseller
              </button>
              <button
                className={`mobile-dropdown-item ${activeTab === 'tha' ? 'active' : ''}`}
                onClick={() => { setActiveTab('tha'); setIsMobileMenuOpen(false); }}
              >
                <Database size={16} />
                Tescil Edilen THA'lar
              </button>
              <button
                className="mobile-dropdown-item"
                onClick={() => { if (onOpenSqlModal) onOpenSqlModal(); setIsMobileMenuOpen(false); }}
              >
                <Code size={16} />
                SQL Sorguları
              </button>
              <div className="mobile-dropdown-divider"></div>
              <button 
                className="mobile-dropdown-item text-green" 
                onClick={() => { window.dispatchEvent(new Event('export-excel')); setIsMobileMenuOpen(false); }}
              >
                <Download size={16} />
                Excel İndir
              </button>
              <button 
                className="mobile-dropdown-item text-green" 
                onClick={() => { window.dispatchEvent(new Event('export-csv')); setIsMobileMenuOpen(false); }}
              >
                <Download size={16} />
                CSV İndir
              </button>
            </div>
          )}
        </div>

        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tüm tablolarda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="global-search-input"
          />
        </div>
        
        {setMobileViewMode && (
          <button 
            className="mobile-view-toggle-btn" 
            onClick={() => setMobileViewMode(mobileViewMode === 'card' ? 'table' : 'card')}
            title="Görünümü Değiştir"
          >
            {mobileViewMode === 'card' ? <List size={22} /> : <LayoutGrid size={22} />}
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
