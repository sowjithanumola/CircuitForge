import React from 'react';
import { Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'R', desc: 'Rotate selected component by 90 degrees' },
    { key: 'Delete / Backspace', desc: 'Delete selected component or selected wire' },
    { key: 'Escape', desc: 'Cancel wire drawing in progress or deselect' },
    { key: 'Space + Drag', desc: 'Pan canvas workspace freely' },
    { key: 'Scroll Wheel', desc: 'Zoom in / out centered on cursor' },
    { key: 'Click Pin', desc: 'Start or finish connecting a jumper wire' },
    { key: 'Click Component', desc: 'Select and view parameters in Inspector panel' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E131F] border border-[#232B3E] rounded-xl w-full max-w-md shadow-2xl overflow-hidden font-mono">
        <div className="px-5 py-3.5 border-b border-[#232B3E] flex items-center justify-between bg-[#131720]">
          <div className="flex items-center gap-2 text-slate-100 font-bold text-xs">
            <Keyboard className="w-4 h-4 text-[#00F0FF]" />
            <span>Keyboard Shortcuts &amp; Controls</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>

        <div className="p-5 space-y-2 text-xs">
          {shortcuts.map(sc => (
            <div key={sc.key} className="flex items-center justify-between py-1.5 border-b border-[#1C2433]">
              <span className="text-slate-400">{sc.desc}</span>
              <kbd className="px-2 py-0.5 bg-[#131720] border border-[#232B3E] text-[#00F0FF] rounded text-[11px] font-bold">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-[#131720] border-t border-[#232B3E] text-right">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
