import React, { useState } from 'react';
import { ComponentType, WireColor } from '../../types/circuit';
import { COMPONENT_TEMPLATES } from '../../data/componentRegistry';
import { Search, Plus, Palette } from 'lucide-react';

interface ComponentSidebarProps {
  onAddComponent: (type: ComponentType) => void;
  activeWireColor: WireColor;
  onChangeWireColor: (color: WireColor) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const WIRE_COLORS: Array<{ color: WireColor; label: string }> = [
  { color: '#EF4444', label: 'Red (VCC)' },
  { color: '#0F172A', label: 'Black (GND)' },
  { color: '#3B82F6', label: 'Blue' },
  { color: '#10B981', label: 'Green' },
  { color: '#F59E0B', label: 'Yellow' },
  { color: '#F97316', label: 'Orange' },
  { color: '#8B5CF6', label: 'Violet' },
];

export const ComponentSidebar: React.FC<ComponentSidebarProps> = ({
  onAddComponent,
  activeWireColor,
  onChangeWireColor,
  isOpen,
  onToggle,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Sources', 'Passives', 'Semiconductors', 'Switches', 'Modules'];

  const templatesList = Object.values(COMPONENT_TEMPLATES);

  const filteredComponents = templatesList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-[#0E131F] border-r border-[#232B3E] flex flex-col h-full z-20 select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#232B3E] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-[#00F0FF]" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-200 font-mono">
            Component Library
          </h2>
        </div>
        <button
          onClick={onToggle}
          className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-[#1C2433] transition-colors"
        >
          Hide
        </button>
      </div>

      {/* Wire Color Palette Quick Picker */}
      <div className="p-3 border-b border-[#232B3E] bg-[#090C13]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Palette className="w-3 h-3 text-[#00F0FF]" />
            Wire Color
          </span>
          <span className="text-[10px] font-mono text-slate-500">Click to set</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {WIRE_COLORS.map(wc => (
            <button
              key={wc.color}
              onClick={() => onChangeWireColor(wc.color)}
              title={wc.label}
              className={`w-6 h-6 rounded border transition-all ${
                activeWireColor === wc.color
                  ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                  : 'border-[#334155] hover:border-slate-400 opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: wc.color }}
            />
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-[#232B3E]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts (resistor, led...)"
            className="w-full bg-[#131720] border border-[#232B3E] rounded px-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00F0FF] font-mono"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1E293B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filteredComponents.map(item => (
          <div
            key={item.type}
            onClick={() => onAddComponent(item.type)}
            className="group p-2.5 bg-[#131720] hover:bg-[#1C2433] border border-[#232B3E] hover:border-[#00F0FF]/50 rounded cursor-pointer transition-all flex items-start justify-between gap-2"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-semibold text-slate-100 group-hover:text-[#00F0FF] transition-colors">
                  {item.name}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#090B10] border border-[#232B3E] text-slate-400 rounded">
                  {item.designatorPrefix}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>

            <button
              className="mt-0.5 p-1 bg-[#1C2433] group-hover:bg-[#00F0FF] text-slate-300 group-hover:text-black rounded transition-colors"
              title="Add component to canvas"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">
            No components match &quot;{search}&quot;
          </div>
        )}
      </div>

      {/* Bottom Tip */}
      <div className="p-2 border-t border-[#232B3E] text-[10px] text-slate-500 font-mono text-center bg-[#090C13]">
        Tip: Click to place, R to rotate, Del to remove
      </div>
    </aside>
  );
};
