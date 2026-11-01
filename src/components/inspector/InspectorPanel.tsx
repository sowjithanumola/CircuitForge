import React from 'react';
import { CircuitComponent, ComponentSimulationResult } from '../../types/circuit';
import { ResistorBandsPreview } from '../common/ResistorColorCode';
import { Zap, Activity, Flame, CheckCircle2, AlertTriangle, XCircle, RotateCw, Trash2 } from 'lucide-react';

interface InspectorPanelProps {
  component: CircuitComponent | null;
  simResult?: ComponentSimulationResult;
  isSimulating: boolean;
  onUpdateProperties: (id: string, properties: Partial<CircuitComponent['properties']>) => void;
  onUpdateDesignator: (id: string, designator: string) => void;
  onRotateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onClose: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  component,
  simResult,
  isSimulating,
  onUpdateProperties,
  onUpdateDesignator,
  onRotateComponent,
  onDeleteComponent,
  onClose,
}) => {
  if (!component) {
    return (
      <aside className="w-80 bg-[#0E131F] border-l border-[#232B3E] p-4 flex flex-col justify-center items-center text-center select-none text-slate-500 font-mono text-xs">
        <Activity className="w-8 h-8 text-slate-600 mb-2 stroke-[1.5]" />
        <span>Select any component or wire on the canvas to inspect electrical parameters and properties.</span>
      </aside>
    );
  }

  const { type, designator, properties } = component;

  // Resistance presets
  const resistancePresets = [
    { label: '220Ω', val: 220, unit: 'Ω' },
    { label: '330Ω', val: 330, unit: 'Ω' },
    { label: '470Ω', val: 470, unit: 'Ω' },
    { label: '1kΩ', val: 1, unit: 'kΩ' },
    { label: '10kΩ', val: 10, unit: 'kΩ' },
    { label: '100kΩ', val: 100, unit: 'kΩ' },
  ];

  const ledColors: Array<{ id: 'red' | 'green' | 'blue' | 'amber' | 'white'; label: string; hex: string }> = [
    { id: 'red', label: 'Red (1.9V)', hex: '#EF4444' },
    { id: 'green', label: 'Green (2.2V)', hex: '#22C55E' },
    { id: 'blue', label: 'Blue (3.1V)', hex: '#3B82F6' },
    { id: 'amber', label: 'Amber (2.1V)', hex: '#F59E0B' },
    { id: 'white', label: 'White (3.1V)', hex: '#F8FAFC' },
  ];

  return (
    <aside className="w-80 bg-[#0E131F] border-l border-[#232B3E] flex flex-col h-full overflow-y-auto select-none z-20">
      {/* Header */}
      <div className="p-3 border-b border-[#232B3E] flex items-center justify-between bg-[#131720]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#00F0FF]" />
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Inspector</span>
            <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
              {designator}
              <span className="text-xs font-normal text-slate-400">({type})</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onRotateComponent(component.id)}
            title="Rotate 90° (R)"
            className="p-1.5 text-slate-300 hover:text-[#00F0FF] hover:bg-[#1C2433] rounded transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteComponent(component.id)}
            title="Delete (Del)"
            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white px-2 py-0.5 text-xs rounded hover:bg-[#1C2433]"
          >
            ✕
          </button>
        </div>
      </div>

      {/* LIVE SIMULATION TELEMETRY (Only shown when simulation has active results) */}
      {isSimulating && simResult ? (
        <div className="p-3 bg-[#090C13] border-b border-[#232B3E]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-[#00F0FF] flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-[#00F0FF]" />
              Live Simulation Telemetry
            </span>
            {simResult.status === 'overcurrent' || simResult.status === 'short_circuit' ? (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-mono rounded flex items-center gap-1 font-bold">
                <Flame className="w-3 h-3" />
                OVERLOAD
              </span>
            ) : simResult.status === 'active' ? (
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono rounded flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                ACTIVE
              </span>
            ) : (
              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-mono rounded">
                STANDBY
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 bg-[#131720] border border-[#232B3E] rounded">
              <span className="text-[9px] text-slate-500 uppercase block">Voltage Drop</span>
              <span className="text-xs font-bold text-slate-100">
                {Math.abs(simResult.voltageDrop).toFixed(2)} V
              </span>
            </div>

            <div className="p-2 bg-[#131720] border border-[#232B3E] rounded">
              <span className="text-[9px] text-slate-500 uppercase block">Current</span>
              <span className="text-xs font-bold text-[#00F0FF]">
                {(Math.abs(simResult.current) * 1000).toFixed(1)} mA
              </span>
            </div>

            <div className="p-2 bg-[#131720] border border-[#232B3E] rounded">
              <span className="text-[9px] text-slate-500 uppercase block">Power (P)</span>
              <span className="text-xs font-bold text-amber-400">
                {simResult.power > 1
                  ? `${simResult.power.toFixed(2)} W`
                  : `${(simResult.power * 1000).toFixed(1)} mW`}
              </span>
            </div>
          </div>

          {/* Status Diagnostic Message */}
          {simResult.statusMessage && (
            <div className={`mt-2 p-2 rounded text-[11px] font-mono border ${
              simResult.status === 'overcurrent' || simResult.status === 'short_circuit'
                ? 'bg-red-950/40 border-red-500/40 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              {simResult.statusMessage}
            </div>
          )}

          {/* Pin Voltages breakdown */}
          <div className="mt-2.5 pt-2 border-t border-[#1E293B]">
            <span className="text-[10px] font-mono text-slate-400 block mb-1">Pin Nodal Potentials:</span>
            <div className="space-y-1">
              {component.pins.map(pin => (
                <div key={pin.id} className="flex items-center justify-between text-[11px] font-mono bg-[#131720] px-2 py-1 rounded border border-[#232B3E]">
                  <span className="text-slate-400">{pin.name} ({pin.label || pin.id}):</span>
                  <span className="text-cyan-400 font-semibold">
                    {simResult.pinVoltages[pin.id] !== undefined
                      ? `${simResult.pinVoltages[pin.id].toFixed(2)} V`
                      : '0.00 V'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-[#090C13] border-b border-[#232B3E] text-[11px] text-slate-500 font-mono flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-600" />
          <span>Press Start Simulation to calculate live voltage, current, and power.</span>
        </div>
      )}

      {/* EDITABLE PROPERTIES */}
      <div className="p-4 space-y-4 flex-1">
        {/* Identifier / Designator */}
        <div>
          <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
            Reference Designator
          </label>
          <input
            type="text"
            value={designator}
            onChange={(e) => onUpdateDesignator(component.id, e.target.value.toUpperCase())}
            className="w-full bg-[#131720] border border-[#232B3E] rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#00F0FF]"
          />
        </div>

        {/* RESISTOR CONTROLS */}
        {type === 'resistor' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Resistance Value
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={properties.resistance ?? 220}
                  onChange={(e) => onUpdateProperties(component.id, { resistance: parseFloat(e.target.value) || 0 })}
                  className="flex-1 bg-[#131720] border border-[#232B3E] rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#00F0FF]"
                />
                <select
                  value={properties.resistanceUnit || 'Ω'}
                  onChange={(e) => onUpdateProperties(component.id, { resistanceUnit: e.target.value as any })}
                  className="bg-[#131720] border border-[#232B3E] rounded px-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="Ω">Ω</option>
                  <option value="kΩ">kΩ</option>
                  <option value="MΩ">MΩ</option>
                </select>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[10px] font-mono text-slate-500 block mb-1.5">Common Values:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {resistancePresets.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => onUpdateProperties(component.id, { resistance: preset.val, resistanceUnit: preset.unit as any })}
                    className="px-2 py-1 bg-[#131720] hover:bg-[#1E293B] border border-[#232B3E] text-slate-300 text-[10px] font-mono rounded transition-colors text-center"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Band Visualizer */}
            <div className="pt-2 border-t border-[#1E293B]">
              <span className="text-[10px] font-mono text-slate-400 block mb-2">Resistor 4-Band Code:</span>
              <div className="bg-[#131720] p-2.5 rounded border border-[#232B3E]">
                <ResistorBandsPreview
                  resistance={properties.resistance ?? 220}
                  unit={properties.resistanceUnit || 'Ω'}
                />
              </div>
            </div>
          </div>
        )}

        {/* LED CONTROLS */}
        {type === 'led' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5">
                LED Color &amp; Forward Drop
              </label>
              <div className="space-y-1.5">
                {ledColors.map(c => (
                  <button
                    key={c.id}
                    onClick={() => onUpdateProperties(component.id, {
                      ledColor: c.id,
                      forwardVoltage: c.id === 'blue' || c.id === 'white' ? 3.1 : c.id === 'green' ? 2.2 : c.id === 'amber' ? 2.1 : 1.9,
                    })}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs font-mono border transition-all ${
                      properties.ledColor === c.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-white'
                        : 'border-[#232B3E] bg-[#131720] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.label}</span>
                    </div>
                    {properties.ledColor === c.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BATTERY & DC SOURCE CONTROLS */}
        {(type === 'battery_9v' || type === 'dc_source') && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Source Voltage (V)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  max="48"
                  step="0.5"
                  value={properties.voltage ?? (type === 'battery_9v' ? 9.0 : 5.0)}
                  onChange={(e) => onUpdateProperties(component.id, { voltage: parseFloat(e.target.value) || 0 })}
                  className="flex-1 bg-[#131720] border border-[#232B3E] rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#00F0FF]"
                />
                <span className="text-xs font-mono text-slate-400">Volts DC</span>
              </div>
            </div>

            {/* Quick voltage buttons */}
            <div className="grid grid-cols-4 gap-1.5">
              {[3.3, 5.0, 9.0, 12.0].map(v => (
                <button
                  key={v}
                  onClick={() => onUpdateProperties(component.id, { voltage: v })}
                  className="px-2 py-1 bg-[#131720] hover:bg-[#1E293B] border border-[#232B3E] text-slate-300 text-[10px] font-mono rounded transition-colors text-center"
                >
                  {v}V
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SWITCH CONTROLS */}
        {type === 'switch_spst' && (
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5">
              Toggle Switch State
            </label>
            <button
              onClick={() => onUpdateProperties(component.id, { switchClosed: !properties.switchClosed })}
              className={`w-full py-2 px-3 rounded font-mono text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${
                properties.switchClosed
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <span>{properties.switchClosed ? 'SWITCH CLOSED (ON)' : 'SWITCH OPEN (OFF)'}</span>
            </button>
          </div>
        )}

        {/* PUSH BUTTON CONTROLS */}
        {type === 'push_button' && (
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5">
              Momentary Tactile Push Button
            </label>
            <button
              onMouseDown={() => onUpdateProperties(component.id, { buttonPressed: true })}
              onMouseUp={() => onUpdateProperties(component.id, { buttonPressed: false })}
              className={`w-full py-3 px-3 rounded font-mono text-xs font-bold border transition-all ${
                properties.buttonPressed
                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] scale-98'
                  : 'bg-[#1C2433] text-slate-200 border-[#232B3E] hover:border-slate-400'
              }`}
            >
              PRESS AND HOLD
            </button>
          </div>
        )}

        {/* CAPACITOR CONTROLS */}
        {type === 'capacitor' && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Capacitance Value
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={properties.capacitance ?? 100}
                  onChange={(e) => onUpdateProperties(component.id, { capacitance: parseFloat(e.target.value) || 0 })}
                  className="flex-1 bg-[#131720] border border-[#232B3E] rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-[#00F0FF]"
                />
                <select
                  value={properties.capacitanceUnit || 'µF'}
                  onChange={(e) => onUpdateProperties(component.id, { capacitanceUnit: e.target.value as any })}
                  className="bg-[#131720] border border-[#232B3E] rounded px-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#00F0FF]"
                >
                  <option value="pF">pF</option>
                  <option value="nF">nF</option>
                  <option value="µF">µF</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
