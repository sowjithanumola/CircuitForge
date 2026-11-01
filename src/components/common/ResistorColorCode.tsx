import React from 'react';

const COLOR_MAP: Record<string, { name: string; bg: string; text: string; digit: number; mult: number }> = {
  black: { name: 'Black', bg: '#000000', text: '#ffffff', digit: 0, mult: 1 },
  brown: { name: 'Brown', bg: '#8B4513', text: '#ffffff', digit: 1, mult: 10 },
  red: { name: 'Red', bg: '#DC2626', text: '#ffffff', digit: 2, mult: 100 },
  orange: { name: 'Orange', bg: '#F97316', text: '#ffffff', digit: 3, mult: 1000 },
  yellow: { name: 'Yellow', bg: '#EAB308', text: '#000000', digit: 4, mult: 10000 },
  green: { name: 'Green', bg: '#16A34A', text: '#ffffff', digit: 5, mult: 100000 },
  blue: { name: 'Blue', bg: '#2563EB', text: '#ffffff', digit: 6, mult: 1000000 },
  violet: { name: 'Violet', bg: '#9333EA', text: '#ffffff', digit: 7, mult: 10000000 },
  gray: { name: 'Gray', bg: '#6B7280', text: '#ffffff', digit: 8, mult: 100000000 },
  white: { name: 'White', bg: '#F3F4F6', text: '#000000', digit: 9, mult: 1000000000 },
  gold: { name: 'Gold', bg: '#D4AF37', text: '#000000', digit: -1, mult: 0.1 },
  silver: { name: 'Silver', bg: '#C0C0C0', text: '#000000', digit: -2, mult: 0.01 },
};

export function getResistorColorBands(resistanceInOhms: number): string[] {
  if (resistanceInOhms <= 0) return ['black', 'black', 'black', 'gold'];

  // Convert to scientific notation
  const str = resistanceInOhms.toExponential();
  const [mantissaStr, expStr] = str.split('e');
  const exp = parseInt(expStr, 10);
  const mantissa = parseFloat(mantissaStr);

  // Normalized digits
  let d1 = Math.floor(mantissa);
  let d2 = Math.round((mantissa - d1) * 10);
  let multiplierExp = exp - 1;

  if (d2 >= 10) {
    d1 += 1;
    d2 = 0;
  }

  const digits = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'];

  const band1 = digits[Math.min(9, Math.max(0, d1))] || 'brown';
  const band2 = digits[Math.min(9, Math.max(0, d2))] || 'black';

  let band3 = 'black';
  if (multiplierExp === -2) band3 = 'silver';
  else if (multiplierExp === -1) band3 = 'gold';
  else if (multiplierExp >= 0 && multiplierExp < digits.length) band3 = digits[multiplierExp];
  else band3 = 'black';

  return [band1, band2, band3, 'gold'];
}

export const ResistorBandsPreview: React.FC<{
  resistance: number;
  unit?: string;
  width?: number;
  height?: number;
}> = ({ resistance, unit = 'Ω', width = 120, height = 30 }) => {
  let ohms = resistance;
  if (unit === 'kΩ') ohms *= 1000;
  if (unit === 'MΩ') ohms *= 1000000;

  const bands = getResistorColorBands(ohms);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 30"
        className="drop-shadow-sm select-none"
      >
        {/* Metal lead wires */}
        <line x1="5" y1="15" x2="30" y2="15" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <line x1="90" y1="15" x2="115" y2="15" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />

        {/* Resistor body (beige/tan ceramic) */}
        <rect x="25" y="6" width="70" height="18" rx="6" fill="#D6B88D" stroke="#A78253" strokeWidth="1" />
        {/* Bulb ends */}
        <rect x="23" y="4" width="10" height="22" rx="4" fill="#D6B88D" />
        <rect x="87" y="4" width="10" height="22" rx="4" fill="#D6B88D" />

        {/* Band 1 */}
        <rect x="35" y="4" width="5" height="22" fill={COLOR_MAP[bands[0]]?.bg || '#000'} />
        {/* Band 2 */}
        <rect x="47" y="6" width="5" height="18" fill={COLOR_MAP[bands[1]]?.bg || '#000'} />
        {/* Band 3 (Multiplier) */}
        <rect x="59" y="6" width="5" height="18" fill={COLOR_MAP[bands[2]]?.bg || '#000'} />
        {/* Band 4 (Tolerance) */}
        <rect x="79" y="4" width="5" height="22" fill={COLOR_MAP[bands[3]]?.bg || '#D4AF37'} />
      </svg>
      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
        {bands.map((b, i) => (
          <span
            key={i}
            className="px-1 py-0.5 rounded text-[9px] font-semibold"
            style={{
              backgroundColor: COLOR_MAP[b]?.bg || '#333',
              color: COLOR_MAP[b]?.text || '#fff',
            }}
          >
            {b.toUpperCase()}
          </span>
        ))}
        <span className="text-slate-500 text-[10px] ml-1">(±5%)</span>
      </div>
    </div>
  );
};
