import { Printer, RefreshCw, Cpu, Layers } from 'lucide-react';
import { ProjectPreset } from '../types/engineering';
import { DEFAULT_PRESETS } from '../data/defaultPresets';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPresetId: string;
  onSelectPreset: (preset: ProjectPreset) => void;
  onOpenExportModal: () => void;
}

export function Navbar({
  activeTab,
  setActiveTab,
  selectedPresetId,
  onSelectPreset,
  onOpenExportModal
}: Props) {
  const tabs = [
    { id: 'overview', label: 'ภาพรวม & สูตรคำนวณ' },
    { id: 'simulation', label: 'Simulation (4k–7k)' },
    { id: 'topdown', label: 'Top-Down & UPPH' },
    { id: 'balancing', label: 'Line Balancing (CT)' },
    { id: 'speedline', label: 'Speed Line' },
    { id: 'manpower', label: 'Manpower Request' },
    { id: 'converters', label: 'IE Converters' }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Primary Top Bar: 3 Zones Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-mono font-bold text-sm">
            IE
          </div>
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            IE Productivity Master
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Action & Preset Quick Pick */}
        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={selectedPresetId}
            onChange={(e) => {
              const p = DEFAULT_PRESETS.find((x) => x.id === e.target.value);
              if (p) onSelectPreset(p);
            }}
            className="hidden sm:block text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-sans"
          >
            {DEFAULT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                พรีเซ็ต: {p.category}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenExportModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm shadow-blue-600/30"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน / PDF</span>
          </button>
        </div>
      </div>

      {/* Mobile & Small Screens Scrollable Tab Bar */}
      <div className="lg:hidden px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}
