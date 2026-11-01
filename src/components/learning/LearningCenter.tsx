import React, { useState } from 'react';
import { BookOpen, Calculator, Award, Lightbulb, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { ResistorBandsPreview } from '../common/ResistorColorCode';
import { ProjectData } from '../../types/circuit';
import { COMPONENT_TEMPLATES } from '../../data/componentRegistry';

interface LearningCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadChallengeProject: (project: ProjectData) => void;
}

export const LearningCenter: React.FC<LearningCenterProps> = ({
  isOpen,
  onClose,
  onLoadChallengeProject,
}) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'guide' | 'challenges'>('calculator');

  // Ohm's Law Calculator state
  const [calcV, setCalcV] = useState<string>('9');
  const [calcI, setCalcI] = useState<string>('0.03');
  const [calcR, setCalcR] = useState<string>('300');
  const [calcP, setCalcP] = useState<string>('0.27');
  const [lastEdited, setLastEdited] = useState<[string, string]>(['V', 'R']);

  // Resistor band tester state
  const [testOhms, setTestOhms] = useState<number>(470);

  // Recalculate Ohm's law
  const handleCalcChange = (field: 'V' | 'I' | 'R' | 'P', val: string) => {
    if (field === 'V') setCalcV(val);
    if (field === 'I') setCalcI(val);
    if (field === 'R') setCalcR(val);
    if (field === 'P') setCalcP(val);

    // Keep track of the last two fields edited
    const newLast = [field, lastEdited[0] === field ? lastEdited[1] : lastEdited[0]] as [string, string];
    setLastEdited(newLast);

    const vNum = field === 'V' ? parseFloat(val) : parseFloat(calcV);
    const iNum = field === 'I' ? parseFloat(val) : parseFloat(calcI);
    const rNum = field === 'R' ? parseFloat(val) : parseFloat(calcR);
    const pNum = field === 'P' ? parseFloat(val) : parseFloat(calcP);

    if (newLast.includes('V') && newLast.includes('R') && !isNaN(vNum) && !isNaN(rNum) && rNum > 0) {
      const i = vNum / rNum;
      const p = vNum * i;
      setCalcI(i.toFixed(4));
      setCalcP(p.toFixed(4));
    } else if (newLast.includes('V') && newLast.includes('I') && !isNaN(vNum) && !isNaN(iNum) && iNum > 0) {
      const r = vNum / iNum;
      const p = vNum * iNum;
      setCalcR(r.toFixed(1));
      setCalcP(p.toFixed(4));
    } else if (newLast.includes('I') && newLast.includes('R') && !isNaN(iNum) && !isNaN(rNum)) {
      const v = iNum * rNum;
      const p = v * iNum;
      setCalcV(v.toFixed(2));
      setCalcP(p.toFixed(4));
    } else if (newLast.includes('P') && newLast.includes('V') && !isNaN(pNum) && !isNaN(vNum) && vNum > 0) {
      const i = pNum / vNum;
      const r = (vNum * vNum) / pNum;
      setCalcI(i.toFixed(4));
      setCalcR(r.toFixed(1));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E131F] border border-[#232B3E] rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#232B3E] flex items-center justify-between bg-[#131720]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-500/10 text-[#00F0FF] border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono">Electronics Lab &amp; Learning Center</h2>
              <p className="text-xs text-slate-400">Interactive calculators, component encyclopedias, and circuit challenges.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-[#1E293B] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#232B3E] bg-[#090C13] px-6">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-3 px-4 font-mono text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'calculator'
                ? 'border-[#00F0FF] text-[#00F0FF]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Ohm&apos;s Law &amp; Power
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 font-mono text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'guide'
                ? 'border-[#00F0FF] text-[#00F0FF]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Component Encyclopedia
          </button>

          <button
            onClick={() => setActiveTab('challenges')}
            className={`py-3 px-4 font-mono text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'challenges'
                ? 'border-[#00F0FF] text-[#00F0FF]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            Circuit Challenges
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* OHM'S LAW CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="bg-[#131720] border border-[#232B3E] rounded-lg p-5">
                  <h3 className="text-sm font-bold text-slate-100 font-mono mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#00F0FF]" />
                    Interactive Ohm&apos;s Law Solver
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Edit any two values. The remaining electrical parameters are computed instantly via V = I * R and P = V * I.
                  </p>

                  <div className="space-y-3 font-mono">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Voltage (V) in Volts</label>
                      <input
                        type="number"
                        step="any"
                        value={calcV}
                        onChange={(e) => handleCalcChange('V', e.target.value)}
                        className="w-full bg-[#0E131F] border border-[#232B3E] rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Current (I) in Amperes</label>
                      <input
                        type="number"
                        step="any"
                        value={calcI}
                        onChange={(e) => handleCalcChange('I', e.target.value)}
                        className="w-full bg-[#0E131F] border border-[#232B3E] rounded px-3 py-2 text-sm text-[#00F0FF] focus:outline-none focus:border-[#00F0FF]"
                      />
                      <span className="text-[10px] text-slate-500">
                        = {(parseFloat(calcI) * 1000 || 0).toFixed(1)} milliamperes (mA)
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Resistance (R) in Ohms (Ω)</label>
                      <input
                        type="number"
                        step="any"
                        value={calcR}
                        onChange={(e) => handleCalcChange('R', e.target.value)}
                        className="w-full bg-[#0E131F] border border-[#232B3E] rounded px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#00F0FF]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Power (P) in Watts</label>
                      <input
                        type="number"
                        step="any"
                        value={calcP}
                        onChange={(e) => handleCalcChange('P', e.target.value)}
                        className="w-full bg-[#0E131F] border border-[#232B3E] rounded px-3 py-2 text-sm text-amber-400 focus:outline-none focus:border-[#00F0FF]"
                      />
                      <span className="text-[10px] text-slate-500">
                        = {(parseFloat(calcP) * 1000 || 0).toFixed(1)} milliwatts (mW)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Formula reference card */}
                <div className="bg-[#131720] border border-[#232B3E] rounded-lg p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-mono mb-3">Core Formulas</h3>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 bg-[#090C13] rounded border border-[#232B3E]">
                        <span className="text-[#00F0FF] font-bold block mb-1">Voltage Drop</span>
                        <code className="text-slate-300">V = I × R</code>
                        <p className="text-[10px] text-slate-500 mt-1">Voltage equals current multiplied by resistance.</p>
                      </div>

                      <div className="p-3 bg-[#090C13] rounded border border-[#232B3E]">
                        <span className="text-[#00F0FF] font-bold block mb-1">Electric Current</span>
                        <code className="text-slate-300">I = V / R</code>
                        <p className="text-[10px] text-slate-500 mt-1">Current equals voltage divided by resistance.</p>
                      </div>

                      <div className="p-3 bg-[#090C13] rounded border border-[#232B3E]">
                        <span className="text-amber-400 font-bold block mb-1">Power Dissipation</span>
                        <code className="text-slate-300">P = V × I = I² × R = V² / R</code>
                        <p className="text-[10px] text-slate-500 mt-1">Power dissipated as heat across the component.</p>
                      </div>
                    </div>
                  </div>

                  {/* Resistor color band tester */}
                  <div className="mt-4 pt-4 border-t border-[#232B3E]">
                    <span className="text-xs font-mono text-slate-300 block mb-2 font-bold">Resistor Band Simulator</span>
                    <div className="flex items-center gap-2 mb-2 font-mono text-xs">
                      <span className="text-slate-400">Value:</span>
                      <input
                        type="number"
                        value={testOhms}
                        onChange={(e) => setTestOhms(parseFloat(e.target.value) || 0)}
                        className="w-24 bg-[#090C13] border border-[#232B3E] rounded px-2 py-1 text-slate-100 text-xs"
                      />
                      <span className="text-slate-400">Ω</span>
                    </div>
                    <ResistorBandsPreview resistance={testOhms} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COMPONENT ENCYCLOPEDIA */}
          {activeTab === 'guide' && (
            <div className="space-y-4 font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#131720] border border-[#232B3E] rounded-lg">
                  <h4 className="text-sm font-bold text-[#00F0FF] mb-2">Solderless Breadboard</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
                    A solderless breadboard consists of internal conductive metal spring clips.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside font-sans">
                    <li><strong className="text-slate-200">Terminal Strips:</strong> Holes A, B, C, D, E in each column are electrically connected together.</li>
                    <li><strong className="text-slate-200">Center Trough:</strong> Separates rows A-E from F-J so dual in-line package (DIP) IC pins do not short together.</li>
                    <li><strong className="text-slate-200">Power Rails:</strong> Horizontal lines marked with red (+) and blue (-) distribute VCC and GND.</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#131720] border border-[#232B3E] rounded-lg">
                  <h4 className="text-sm font-bold text-[#00F0FF] mb-2">Light Emitting Diode (LED)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
                    A polarized semiconductor light source that conducts current in one direction only.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside font-sans">
                    <li><strong className="text-slate-200">Anode (+):</strong> Longer metal lead, connects to the positive side.</li>
                    <li><strong className="text-slate-200">Cathode (-):</strong> Shorter lead and flat notch on the plastic dome rim, connects to ground.</li>
                    <li><strong className="text-slate-200">Forward Drop:</strong> Red ~1.9V, Green ~2.2V, Blue ~3.1V. Always use a series current-limiting resistor!</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#131720] border border-[#232B3E] rounded-lg">
                  <h4 className="text-sm font-bold text-[#00F0FF] mb-2">Resistors &amp; Power Ratings</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
                    Resistors limit electrical current and produce a proportional voltage drop according to Ohm&apos;s Law.
                  </p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside font-sans">
                    <li>Standard carbon-film resistors are rated for 0.25W (250mW) continuous heat dissipation.</li>
                    <li>Exceeding power rating results in overheating and component breakdown.</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#131720] border border-[#232B3E] rounded-lg">
                  <h4 className="text-sm font-bold text-[#00F0FF] mb-2">Voltage Dividers</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
                    A linear circuit that produces an output voltage that is a fraction of its input voltage.
                  </p>
                  <div className="p-2 bg-[#090C13] border border-[#232B3E] rounded text-xs text-cyan-300">
                    Vout = Vin × (R2 / (R1 + R2))
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GUIDED CHALLENGES */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#131720] border border-[#232B3E] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">Challenge 1</span>
                  <h4 className="text-sm font-bold text-slate-100 font-mono mt-0.5">Light the LED Safely</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl font-sans">
                    A 9V battery supplies power to a red LED (forward voltage 2.0V, max safe current 25mA).
                    Calculate and set the correct resistor value so the current is between 15mA and 25mA.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const challengeProject: ProjectData = {
                      id: `challenge_1_${Date.now()}`,
                      name: 'Challenge 1: Safe LED Limiting',
                      description: 'Set the resistor value so the LED conducts safely between 15mA and 25mA without blowing.',
                      version: 1,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      activeMode: 'breadboard',
                      breadboardView: { x: 50, y: 30, zoom: 1 },
                      schematicView: { x: 60, y: 50, zoom: 1 },
                      components: [
                        {
                          id: 'c1_bat',
                          type: 'battery_9v',
                          designator: 'BAT1',
                          breadboardPos: { x: 180, y: 220 },
                          schematicPos: { x: 140, y: 220 },
                          rotation: 0,
                          properties: { voltage: 9.0 },
                          pins: JSON.parse(JSON.stringify(COMPONENT_TEMPLATES.battery_9v.pins)),
                        },
                        {
                          id: 'c1_res',
                          type: 'resistor',
                          designator: 'R1',
                          breadboardPos: { x: 380, y: 155 },
                          schematicPos: { x: 280, y: 160 },
                          rotation: 0,
                          properties: { resistance: 10, resistanceUnit: 'Ω' }, // Intentionally low so user must fix it!
                          pins: JSON.parse(JSON.stringify(COMPONENT_TEMPLATES.resistor.pins)),
                        },
                        {
                          id: 'c1_led',
                          type: 'led',
                          designator: 'D1',
                          breadboardPos: { x: 550, y: 180 },
                          schematicPos: { x: 420, y: 200 },
                          rotation: 0,
                          properties: { ledColor: 'red', forwardVoltage: 2.0, maxCurrent: 0.03 },
                          pins: JSON.parse(JSON.stringify(COMPONENT_TEMPLATES.led.pins)),
                        },
                      ],
                      wires: [
                        { id: 'cw1', fromComponentId: 'c1_bat', fromPinId: 'pos', toComponentId: 'c1_res', toPinId: 'p1', color: '#EF4444' },
                        { id: 'cw2', fromComponentId: 'c1_res', fromPinId: 'p2', toComponentId: 'c1_led', toPinId: 'anode', color: '#F59E0B' },
                        { id: 'cw3', fromComponentId: 'c1_led', fromPinId: 'cathode', toComponentId: 'c1_bat', toPinId: 'neg', color: '#0F172A' },
                      ],
                    };
                    onLoadChallengeProject(challengeProject);
                    onClose();
                  }}
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-500/40 rounded font-mono text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>Load Challenge</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 bg-[#131720] border border-[#232B3E] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">Challenge 2</span>
                  <h4 className="text-sm font-bold text-slate-100 font-mono mt-0.5">The 4.5V Symmetrical Divider</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl font-sans">
                    Construct a voltage divider from a 9V source to produce an exact 4.50V potential at the midpoint junction.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const challengeProject: ProjectData = {
                      id: `challenge_2_${Date.now()}`,
                      name: 'Challenge 2: Symmetrical Voltage Divider',
                      description: 'Configure equal resistance values to achieve exactly 4.5V midpoint voltage.',
                      version: 1,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      activeMode: 'schematic',
                      breadboardView: { x: 40, y: 20, zoom: 1 },
                      schematicView: { x: 80, y: 60, zoom: 1 },
                      components: [
                        {
                          id: 'c2_src',
                          type: 'dc_source',
                          designator: 'V1',
                          breadboardPos: { x: 180, y: 220 },
                          schematicPos: { x: 140, y: 220 },
                          rotation: 0,
                          properties: { voltage: 9.0 },
                          pins: JSON.parse(JSON.stringify(COMPONENT_TEMPLATES.dc_source.pins)),
                        },
                        {
                          id: 'c2_r1',
                          type: 'resistor',
                          designator: 'R1',
                          breadboardPos: { x: 360, y: 160 },
                          schematicPos: { x: 320, y: 160 },
                          rotation: 90,
                          properties: { resistance: 10, resistanceUnit: 'kΩ' },
                          pins: JSON.parse(JSON.stringify(COMPONENT_TEMPLATES.resistor.pins)),
                        },
                        {
                          id: 'c2_r2',
                          type: 'resistor',
                          designator: 'R2',
                          breadboardPos: { x: 360, y: 300 },
                          schematicPos: { x: 320, y: 290 },
                          rotation: 90,
                          properties: { resistance: 1, resistanceUnit: 'kΩ' }, // User changes to 10kΩ
                          pins: JSON.parse(JSON.stringify(COMPONENT_TEMPLATES.resistor.pins)),
                        },
                        {
                          id: 'c2_gnd',
                          type: 'ground',
                          designator: 'GND1',
                          breadboardPos: { x: 360, y: 400 },
                          schematicPos: { x: 320, y: 390 },
                          rotation: 0,
                          properties: { voltage: 0 },
                          pins: JSON.parse(JSON.stringify(COMPONENT_TEMPLATES.ground.pins)),
                        },
                      ],
                      wires: [
                        { id: 'cw2_1', fromComponentId: 'c2_src', fromPinId: 'pos', toComponentId: 'c2_r1', toPinId: 'p1', color: '#EF4444' },
                        { id: 'cw2_2', fromComponentId: 'c2_r1', fromPinId: 'p2', toComponentId: 'c2_r2', toPinId: 'p1', color: '#3B82F6' },
                        { id: 'cw2_3', fromComponentId: 'c2_r2', fromPinId: 'p2', toComponentId: 'c2_gnd', toPinId: 'gnd', color: '#0F172A' },
                        { id: 'cw2_4', fromComponentId: 'c2_src', fromPinId: 'neg', toComponentId: 'c2_gnd', toPinId: 'gnd', color: '#0F172A' },
                      ],
                    };
                    onLoadChallengeProject(challengeProject);
                    onClose();
                  }}
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-500/40 rounded font-mono text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>Load Challenge</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
