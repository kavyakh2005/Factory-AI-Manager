import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Modal } from '../common/Modal';
import { Search, ShoppingCart, Factory, Boxes, Layers, Package, ArrowRight } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const searchItems = [
    { title: 'Orders Master', subtitle: 'Manage garment orders & size matrices', path: '/orders', icon: <ShoppingCart className="w-4 h-4 text-blue-400" /> },
    { title: 'Production Pipeline', subtitle: 'Cutting, Stitching, Finishing stages', path: '/production', icon: <Factory className="w-4 h-4 text-amber-400" /> },
    { title: 'Stock Ledger & Inventory', subtitle: 'Raw material & finished goods balances', path: '/inventory', icon: <Boxes className="w-4 h-4 text-emerald-400" /> },
    { title: 'Sets & Sizes Master', subtitle: 'Standard Set, Extra Set, Size definitions', path: '/sets-sizes', icon: <Layers className="w-4 h-4 text-purple-400" /> },
    { title: 'Products & Variants', subtitle: 'Coord sets, fabrics, colors, SKUs', path: '/products', icon: <Package className="w-4 h-4 text-pink-400" /> },
  ];

  const filteredItems = searchItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-factory-950">
      {/* Left Sidebar */}
      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-factory-950 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Search Modal (Ctrl + K) */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Quick Search & Navigation"
        subtitle="Quickly jump to any factory module, order, product, or set"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Type module name or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-factory-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {filteredItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsSearchOpen(false);
                  navigate(item.path);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-factory-800/80 transition-colors text-left group border border-transparent hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-factory-950 border border-slate-800">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-primary-300">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.subtitle}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
