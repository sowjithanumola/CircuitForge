import React from 'react';
import { CircuitComponent, ComponentSimulationResult } from '../../types/circuit';
import { getResistorColorBands } from '../common/ResistorColorCode';

interface ComponentProps {
  component: CircuitComponent;
  isSelected: boolean;
  simResult?: ComponentSimulationResult;
  onPinMouseDown?: (pinId: string, e: React.MouseEvent) => void;
  hoveredPinId?: string | null;
  activeWireStartPin?: { componentId: string; pinId: string } | null;
}

export const BreadboardComponentItem: React.FC<ComponentProps> = ({
  component,
  isSelected,
  simResult,
  onPinMouseDown,
  hoveredPinId,
  activeWireStartPin,
}) => {
  const { type, properties, rotation } = component;
  const isSimulating = Boolean(simResult);

  // LED color palette
  const ledColors: Record<string, { base: string; lit: string; glow: string }> = {
    red: { base: '#7F1D1D', lit: '#EF4444', glow: 'rgba(239, 68, 68, 0.7)' },
    green: { base: '#14532D', lit: '#22C55E', glow: 'rgba(34, 197, 94, 0.7)' },
    blue: { base: '#1E3A8A', lit: '#3B82F6', glow: 'rgba(59, 130, 246, 0.7)' },
    amber: { base: '#78350F', lit: '#F59E0B', glow: 'rgba(245, 158, 11, 0.7)' },
    white: { base: '#475569', lit: '#F8FAFC', glow: 'rgba(248, 250, 252, 0.8)' },
  };

  const selectedLed = ledColors[properties.ledColor || 'red'] || ledColors.red;
  const brightness = simResult?.brightness || 0;
  const isBlown = simResult?.status === 'overcurrent' && type === 'led';

  return (
    <g
      transform={`translate(${component.breadboardPos.x}, ${component.breadboardPos.y}) rotate(${rotation})`}
      className="cursor-move"
    >
      {/* Selection halo */}
      {isSelected && (
        <rect
          x="-55"
          y="-40"
          width="110"
          height="80"
          fill="none"
          stroke="#00F0FF"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          rx="4"
          className="pointer-events-none"
        />
      )}

      {/* RENDER SPECIFIC COMPONENT */}
      {type === 'resistor' && (
        <g>
          {/* Metal lead wires connecting to pins */}
          <line x1="-50" y1="0" x2="-28" y2="0" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="0" x2="50" y2="0" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

          {/* Resistor body */}
          <rect x="-26" y="-8" width="52" height="16" rx="5" fill="#D6B88D" stroke="#A78253" strokeWidth="1" />
          <rect x="-28" y="-9" width="8" height="18" rx="3" fill="#D6B88D" />
          <rect x="20" y="-9" width="8" height="18" rx="3" fill="#D6B88D" />

          {/* Color bands */}
          {(() => {
            let r = properties.resistance ?? 220;
            if (properties.resistanceUnit === 'kΩ') r *= 1000;
            if (properties.resistanceUnit === 'MΩ') r *= 1000000;
            const bands = getResistorColorBands(r);
            const colorFill: Record<string, string> = {
              black: '#000000',
              brown: '#8B4513',
              red: '#DC2626',
              orange: '#EA580C',
              yellow: '#FACC15',
              green: '#16A34A',
              blue: '#2563EB',
              violet: '#9333EA',
              gray: '#6B7280',
              white: '#FFFFFF',
              gold: '#D4AF37',
              silver: '#CBD5E1',
            };
            return (
              <g>
                <rect x="-18" y="-9" width="4" height="18" fill={colorFill[bands[0]] || '#000'} />
                <rect x="-9" y="-8" width="4" height="16" fill={colorFill[bands[1]] || '#000'} />
                <rect x="0" y="-8" width="4" height="16" fill={colorFill[bands[2]] || '#000'} />
                <rect x="13" y="-9" width="4" height="18" fill={colorFill[bands[3]] || '#D4AF37'} />
              </g>
            );
          })()}

          {/* Value text tag */}
          <text
            x="0"
            y="-14"
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="10"
            fontFamily="monospace"
            className="select-none pointer-events-none"
          >
            {properties.resistance}{properties.resistanceUnit || 'Ω'}
          </text>
        </g>
      )}

      {type === 'led' && (
        <g>
          {/* Anode wire lead (longer, slightly bent) */}
          <path d="M-15,25 L-15,10 L-6,0" stroke="#CBD5E1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Cathode wire lead (shorter, straight) */}
          <path d="M15,25 L15,10 L6,0" stroke="#CBD5E1" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Radiant glow effect if simulated lit */}
          {brightness > 0 && !isBlown && (
            <circle
              cx="0"
              cy="-10"
              r={16 + brightness * 16}
              fill={selectedLed.glow}
              opacity={0.3 + brightness * 0.6}
              className="pointer-events-none"
            />
          )}

          {/* LED Base ring */}
          <ellipse cx="0" cy="-2" rx="13" ry="5" fill="#334155" />
          {/* Flat cathode notch on right side */}
          <path d="M11,-4 L13,0 L11,4" stroke="#1E293B" strokeWidth="1.5" fill="none" />

          {/* LED Dome Bulb */}
          <path
            d="M-12,-2 C-12,-18 12,-18 12,-2 Z"
            fill={isBlown ? '#1F2937' : (brightness > 0.05 ? selectedLed.lit : selectedLed.base)}
            stroke={isBlown ? '#EF4444' : '#0F172A'}
            strokeWidth="1.2"
          />

          {/* Bulb internal reflection highlight */}
          <path
            d="M-7,-10 C-7,-15 -2,-16 -1,-16"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Blown LED indicator */}
          {isBlown && (
            <text x="0" y="-8" textAnchor="middle" fill="#EF4444" fontSize="12" fontWeight="bold">
              !
            </text>
          )}

          <text
            x="0"
            y="-24"
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="10"
            fontFamily="monospace"
            className="select-none pointer-events-none"
          >
            {component.designator}
          </text>
        </g>
      )}

      {type === 'battery_9v' && (
        <g>
          {/* Rectangular battery body */}
          <rect x="-42" y="-60" width="84" height="120" rx="6" fill="#1E293B" stroke="#334155" strokeWidth="2" />
          <rect x="-40" y="-58" width="80" height="24" fill="#0F172A" />

          {/* Golden/Brass accent bar */}
          <rect x="-40" y="24" width="80" height="8" fill="#D97706" />

          {/* 9V Battery Terminal snaps */}
          {/* Negative snap (hexagonal/flower or circle) */}
          <circle cx="20" cy="-65" r="7" fill="#64748B" stroke="#475569" strokeWidth="1.5" />
          <circle cx="20" cy="-65" r="4" fill="#0F172A" />
          <text x="20" y="-48" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">-</text>

          {/* Positive snap (circle post) */}
          <circle cx="-20" cy="-65" r="6" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="-20" y="-48" textAnchor="middle" fill="#EF4444" fontSize="10" fontWeight="bold">+</text>

          {/* Battery Label */}
          <text x="0" y="-12" textAnchor="middle" fill="#F8FAFC" fontSize="13" fontWeight="bold" fontFamily="monospace">
            9V
          </text>
          <text x="0" y="5" textAnchor="middle" fill="#94A3B8" fontSize="9" letterSpacing="1">
            CIRCUITFORGE
          </text>
          <text x="0" y="18" textAnchor="middle" fill="#64748B" fontSize="8">
            HEAVY DUTY DC
          </text>
        </g>
      )}

      {type === 'dc_source' && (
        <g>
          {/* Bench power supply chassis */}
          <rect x="-45" y="-35" width="90" height="70" rx="4" fill="#131B2E" stroke="#232B3E" strokeWidth="2" />
          {/* Digital 7-segment style LCD display */}
          <rect x="-35" y="-28" width="70" height="24" rx="2" fill="#05080E" stroke="#1E293B" />
          <text x="0" y="-12" textAnchor="middle" fill="#00F0FF" fontSize="12" fontWeight="bold" fontFamily="monospace">
            {properties.voltage?.toFixed(1) || '5.0'} V
          </text>

          {/* Red Positive terminal post */}
          <circle cx="-25" cy="18" r="7" fill="#DC2626" stroke="#EF4444" strokeWidth="1" />
          <circle cx="-25" cy="18" r="3" fill="#000" />
          <text x="-25" y="10" textAnchor="middle" fill="#EF4444" fontSize="9" fontWeight="bold">+</text>

          {/* Black Negative terminal post */}
          <circle cx="25" cy="18" r="7" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <circle cx="25" cy="18" r="3" fill="#000" />
          <text x="25" y="10" textAnchor="middle" fill="#94A3B8" fontSize="9" fontWeight="bold">-</text>
        </g>
      )}

      {type === 'switch_spst' && (
        <g>
          {/* Switch body */}
          <rect x="-30" y="-16" width="60" height="32" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1.5" />
          <rect x="-18" y="-10" width="36" height="20" rx="2" fill="#0F172A" />

          {/* Switch toggle lever */}
          {properties.switchClosed ? (
            <rect x="0" y="-8" width="16" height="16" rx="2" fill="#10B981" stroke="#059669" strokeWidth="1" />
          ) : (
            <rect x="-16" y="-8" width="16" height="16" rx="2" fill="#64748B" stroke="#475569" strokeWidth="1" />
          )}

          {/* Metal terminal pins */}
          <line x1="-25" y1="0" x2="-25" y2="16" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="25" y1="0" x2="25" y2="16" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

          <text x="0" y="-20" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">
            {properties.switchClosed ? 'ON' : 'OFF'}
          </text>
        </g>
      )}

      {type === 'push_button' && (
        <g>
          {/* Tactile button square frame */}
          <rect x="-24" y="-24" width="48" height="48" rx="4" fill="#334155" stroke="#1E293B" strokeWidth="1.5" />
          {/* Metal top plate */}
          <rect x="-18" y="-18" width="36" height="36" rx="3" fill="#64748B" />
          {/* Center tactile button cap */}
          <circle
            cx="0"
            cy="0"
            r={properties.buttonPressed ? 10 : 12}
            fill={properties.buttonPressed ? '#EF4444' : '#1E293B'}
            stroke="#0F172A"
            strokeWidth="1.5"
          />
          <text x="0" y="32" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">
            {component.designator}
          </text>
        </g>
      )}

      {type === 'capacitor' && (
        <g>
          {/* Leads */}
          <line x1="-15" y1="20" x2="-15" y2="0" stroke="#CBD5E1" strokeWidth="2.5" />
          <line x1="15" y1="20" x2="15" y2="0" stroke="#CBD5E1" strokeWidth="2.5" />

          {/* Cylindrical can */}
          <rect x="-20" y="-35" width="40" height="35" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
          {/* Negative polarity stripe */}
          <rect x="8" y="-35" width="8" height="35" fill="#94A3B8" />
          <text x="12" y="-24" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">-</text>
          <text x="12" y="-10" textAnchor="middle" fill="#000" fontSize="8" fontWeight="bold">-</text>

          {/* Value label */}
          <text x="-4" y="-15" textAnchor="middle" fill="#F8FAFC" fontSize="8" fontFamily="monospace">
            {properties.capacitance}{properties.capacitanceUnit || 'µF'}
          </text>
        </g>
      )}

      {type === 'diode' && (
        <g>
          <line x1="-35" y1="0" x2="-20" y2="0" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="20" y1="0" x2="35" y2="0" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

          {/* Diode body */}
          <rect x="-20" y="-7" width="40" height="14" rx="3" fill="#0F172A" stroke="#334155" strokeWidth="1" />
          {/* Silver cathode band */}
          <rect x="12" y="-7" width="6" height="14" fill="#CBD5E1" />

          <text x="-2" y="-11" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">
            1N4007
          </text>
        </g>
      )}

      {type === 'transistor_npn' && (
        <g>
          {/* 3 Leads */}
          <line x1="-15" y1="25" x2="-15" y2="0" stroke="#CBD5E1" strokeWidth="2" />
          <line x1="0" y1="25" x2="0" y2="0" stroke="#CBD5E1" strokeWidth="2" />
          <line x1="15" y1="25" x2="15" y2="0" stroke="#CBD5E1" strokeWidth="2" />

          {/* TO-92 half-cylinder package */}
          <path d="M-20,-5 C-20,-30 20,-30 20,-5 Z" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
          <line x1="-20" y1="-5" x2="20" y2="-5" stroke="#334155" strokeWidth="1.5" />

          <text x="0" y="-12" textAnchor="middle" fill="#94A3B8" fontSize="8" fontFamily="monospace">
            2N2222
          </text>
          <text x="-15" y="35" textAnchor="middle" fill="#64748B" fontSize="8">C</text>
          <text x="0" y="35" textAnchor="middle" fill="#64748B" fontSize="8">B</text>
          <text x="15" y="35" textAnchor="middle" fill="#64748B" fontSize="8">E</text>
        </g>
      )}

      {type === 'ground' && (
        <g>
          {/* Ground socket terminal */}
          <circle cx="0" cy="-15" r="10" fill="#1E293B" stroke="#10B981" strokeWidth="2" />
          <circle cx="0" cy="-15" r="4" fill="#10B981" />
          {/* Diminishing horizontal bars */}
          <line x1="-14" y1="2" x2="14" y2="2" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <line x1="-9" y1="7" x2="9" y2="7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <line x1="-4" y1="12" x2="4" y2="12" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <text x="0" y="24" textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="bold">
            GND
          </text>
        </g>
      )}

      {type === 'arduino_uno' && (
        <g>
          {/* Arduino Uno PCB Board */}
          <rect x="-105" y="-75" width="210" height="150" rx="8" fill="#005C8A" stroke="#003B5C" strokeWidth="2" />
          {/* Silver USB port connector */}
          <rect x="-105" y="-60" width="35" height="30" fill="#94A3B8" stroke="#475569" strokeWidth="1" />
          {/* Black barrel DC power jack */}
          <rect x="-105" y="15" width="40" height="35" fill="#1E293B" stroke="#0F172A" strokeWidth="1" />
          {/* ATmega328P DIP chip */}
          <rect x="-10" y="5" width="70" height="22" rx="2" fill="#0F172A" stroke="#334155" strokeWidth="1" />
          <text x="25" y="20" textAnchor="middle" fill="#94A3B8" fontSize="7" fontFamily="monospace">ATMEGA328P</text>

          {/* Arduino Branding */}
          <text x="25" y="-35" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold" letterSpacing="1">
            ARDUINO
          </text>
          <text x="25" y="-20" textAnchor="middle" fill="#7DD3FC" fontSize="9" fontWeight="bold">
            UNO R3
          </text>

          {/* Top Pin Header (Digital) */}
          <rect x="-65" y="-74" width="145" height="12" fill="#0F172A" />
          {/* Bottom Pin Header (Power & Analog) */}
          <rect x="-95" y="62" width="175" height="12" fill="#0F172A" />
        </g>
      )}

      {/* RENDER PINS (Interactive wire connection points) */}
      {component.pins.map((pin) => {
        const isHovered = hoveredPinId === `${component.id}:${pin.id}`;
        const isStartPin = activeWireStartPin?.componentId === component.id && activeWireStartPin?.pinId === pin.id;
        const pinVoltage = simResult?.pinVoltages[pin.id];

        return (
          <g
            key={pin.id}
            transform={`translate(${pin.breadboardOffset.x}, ${pin.breadboardOffset.y})`}
            onClick={(e) => {
              e.stopPropagation();
              onPinMouseDown?.(pin.id, e);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              // If wire is in progress and not the start pin, complete on mouseUp
              if (activeWireStartPin && (activeWireStartPin.componentId !== component.id || activeWireStartPin.pinId !== pin.id)) {
                onPinMouseDown?.(pin.id, e);
              }
            }}
            className="cursor-crosshair group pointer-events-auto"
          >
            {/* Generous invisible hit target circle (32px diameter) */}
            <circle cx="0" cy="0" r="16" fill="transparent" className="cursor-crosshair" />

            {/* Visual target halo */}
            <circle
              cx="0"
              cy="0"
              r={isHovered || isStartPin ? 11 : 7}
              fill={isStartPin ? '#10B981' : isHovered ? '#00F0FF' : '#334155'}
              fillOpacity={isHovered || isStartPin ? 0.5 : 0.8}
              stroke={isStartPin ? '#10B981' : isHovered ? '#00F0FF' : '#94A3B8'}
              strokeWidth={isHovered || isStartPin ? 2.5 : 1.2}
              className="transition-all duration-150"
            />
            {/* Center metal pin dot */}
            <circle
              cx="0"
              cy="0"
              r={isHovered || isStartPin ? 3.5 : 2.5}
              fill={isStartPin ? '#10B981' : isHovered ? '#00F0FF' : '#F8FAFC'}
            />

            {/* Pin label */}
            <text
              x="0"
              y="16"
              textAnchor="middle"
              fill={isHovered ? '#00F0FF' : isStartPin ? '#10B981' : '#94A3B8'}
              fontSize="9"
              fontWeight={isHovered || isStartPin ? 'bold' : 'normal'}
              fontFamily="monospace"
              className="select-none pointer-events-none"
            >
              {isStartPin ? 'START' : pin.label || pin.name}
            </text>

            {/* Voltage tooltip if simulation is active & hovered */}
            {isSimulating && isHovered && pinVoltage !== undefined && (
              <g transform="translate(0, -18)" className="pointer-events-none">
                <rect x="-26" y="-14" width="52" height="16" rx="3" fill="#0F172A" stroke="#00F0FF" strokeWidth="1" />
                <text x="0" y="-3" textAnchor="middle" fill="#00F0FF" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  {pinVoltage.toFixed(2)}V
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
