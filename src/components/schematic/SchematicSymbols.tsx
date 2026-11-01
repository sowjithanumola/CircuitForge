import React from 'react';
import { CircuitComponent, ComponentSimulationResult } from '../../types/circuit';

interface SchematicSymbolProps {
  component: CircuitComponent;
  isSelected: boolean;
  simResult?: ComponentSimulationResult;
  onPinMouseDown?: (pinId: string, e: React.MouseEvent) => void;
  hoveredPinId?: string | null;
  activeWireStartPin?: { componentId: string; pinId: string } | null;
}

export const SchematicSymbolItem: React.FC<SchematicSymbolProps> = ({
  component,
  isSelected,
  simResult,
  onPinMouseDown,
  hoveredPinId,
  activeWireStartPin,
}) => {
  const { type, properties, designator, rotation } = component;
  const isSimulating = Boolean(simResult);

  // Format value for schematic text display
  const getValueText = () => {
    switch (type) {
      case 'resistor':
        return `${properties.resistance}${properties.resistanceUnit || 'Ω'}`;
      case 'battery_9v':
      case 'dc_source':
        return `${properties.voltage?.toFixed(1) || '9.0'}V`;
      case 'led':
        return `${(properties.ledColor || 'red').toUpperCase()}`;
      case 'capacitor':
        return `${properties.capacitance}${properties.capacitanceUnit || 'µF'}`;
      case 'diode':
        return '1N4007';
      case 'transistor_npn':
        return '2N2222';
      case 'switch_spst':
        return properties.switchClosed ? 'CLOSED' : 'OPEN';
      case 'push_button':
        return properties.buttonPressed ? 'PRESSED' : 'RELEASED';
      default:
        return '';
    }
  };

  const isLit = type === 'led' && (simResult?.brightness || 0) > 0.05;
  const isBlown = type === 'led' && simResult?.status === 'overcurrent';

  return (
    <g
      transform={`translate(${component.schematicPos.x}, ${component.schematicPos.y}) rotate(${rotation})`}
      className="cursor-move select-none"
    >
      {/* Selection bounding box */}
      {isSelected && (
        <rect
          x="-50"
          y="-40"
          width="100"
          height="80"
          fill="none"
          stroke="#00F0FF"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          rx="4"
          className="pointer-events-none"
        />
      )}

      {/* SYMBOL GRAPHICS */}
      {type === 'resistor' && (
        <g>
          {/* Terminal lead lines */}
          <line x1="-40" y1="0" x2="-25" y2="0" stroke="#00F0FF" strokeWidth="2" />
          <line x1="25" y1="0" x2="40" y2="0" stroke="#00F0FF" strokeWidth="2" />

          {/* Classic zig-zag resistor symbol */}
          <path
            d="M -25,0 L -20,-10 L -12,10 L -4,-10 L 4,10 L 12,-10 L 20,10 L 25,0"
            stroke="#00F0FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      )}

      {type === 'led' && (
        <g>
          {/* Anode & Cathode leads */}
          <line x1="-35" y1="0" x2="-15" y2="0" stroke="#00F0FF" strokeWidth="2" />
          <line x1="15" y1="0" x2="35" y2="0" stroke="#00F0FF" strokeWidth="2" />

          {/* Diode Triangle */}
          <polygon
            points="-15,-12 -15,12 10,0"
            fill={isLit ? '#22C55E' : '#131B2E'}
            stroke={isBlown ? '#EF4444' : '#00F0FF'}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Cathode bar */}
          <line x1="10" y1="-12" x2="10" y2="12" stroke={isBlown ? '#EF4444' : '#00F0FF'} strokeWidth="2.5" strokeLinecap="round" />

          {/* Light emission arrows */}
          <g stroke={isLit ? '#22C55E' : '#00F0FF'} strokeWidth="1.8" strokeLinecap="round">
            <line x1="2" y1="-14" x2="12" y2="-24" />
            <path d="M 8,-24 L 12,-24 L 12,-20" fill="none" />
            <line x1="8" y1="-10" x2="18" y2="-20" />
            <path d="M 14,-20 L 18,-20 L 18,-16" fill="none" />
          </g>

          {isBlown && (
            <text x="0" y="4" textAnchor="middle" fill="#EF4444" fontSize="12" fontWeight="bold">
              !
            </text>
          )}
        </g>
      )}

      {type === 'diode' && (
        <g>
          <line x1="-30" y1="0" x2="-12" y2="0" stroke="#00F0FF" strokeWidth="2" />
          <line x1="12" y1="0" x2="30" y2="0" stroke="#00F0FF" strokeWidth="2" />
          {/* Diode triangle */}
          <polygon points="-12,-12 -12,12 12,0" fill="#131B2E" stroke="#00F0FF" strokeWidth="2" strokeLinejoin="round" />
          {/* Cathode bar */}
          <line x1="12" y1="-12" x2="12" y2="12" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {(type === 'battery_9v' || type === 'dc_source') && (
        <g>
          {/* Long line (+) and short thick line (-) */}
          <line x1="-35" y1="0" x2="-10" y2="0" stroke="#00F0FF" strokeWidth="2" />
          <line x1="10" y1="0" x2="35" y2="0" stroke="#00F0FF" strokeWidth="2" />

          {/* Positive plate (longer, thinner) */}
          <line x1="-10" y1="-18" x2="-10" y2="18" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
          <text x="-16" y="-12" fill="#EF4444" fontSize="11" fontWeight="bold">+</text>

          {/* Negative plate (shorter, thicker) */}
          <line x1="10" y1="-10" x2="10" y2="10" stroke="#94A3B8" strokeWidth="4.5" strokeLinecap="round" />
          <text x="16" y="-10" fill="#94A3B8" fontSize="11" fontWeight="bold">-</text>
        </g>
      )}

      {type === 'switch_spst' && (
        <g>
          <line x1="-30" y1="0" x2="-12" y2="0" stroke="#00F0FF" strokeWidth="2" />
          <line x1="12" y1="0" x2="30" y2="0" stroke="#00F0FF" strokeWidth="2" />

          {/* Terminal contacts */}
          <circle cx="-12" cy="0" r="3" fill="#00F0FF" />
          <circle cx="12" cy="0" r="3" fill="#00F0FF" />

          {/* Switch blade lever */}
          {properties.switchClosed ? (
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <line x1="-12" y1="0" x2="8" y2="-15" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
          )}
        </g>
      )}

      {type === 'push_button' && (
        <g>
          <line x1="-30" y1="0" x2="-12" y2="0" stroke="#00F0FF" strokeWidth="2" />
          <line x1="12" y1="0" x2="30" y2="0" stroke="#00F0FF" strokeWidth="2" />

          <circle cx="-12" cy="0" r="3" fill="#00F0FF" />
          <circle cx="12" cy="0" r="3" fill="#00F0FF" />

          {/* Pushbutton plunger & bar */}
          <line
            x1="-16"
            y1={properties.buttonPressed ? 0 : -8}
            x2="16"
            y2={properties.buttonPressed ? 0 : -8}
            stroke={properties.buttonPressed ? '#EF4444' : '#00F0FF'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1={properties.buttonPressed ? 0 : -8}
            x2="0"
            y2={properties.buttonPressed ? -10 : -18}
            stroke="#00F0FF"
            strokeWidth="2"
          />
        </g>
      )}

      {type === 'capacitor' && (
        <g>
          <line x1="-30" y1="0" x2="-8" y2="0" stroke="#00F0FF" strokeWidth="2" />
          <line x1="8" y1="0" x2="30" y2="0" stroke="#00F0FF" strokeWidth="2" />

          {/* Parallel plates */}
          <line x1="-8" y1="-16" x2="-8" y2="16" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />
          <line x1="8" y1="-16" x2="8" y2="16" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />

          {/* Polarity plus symbol */}
          <text x="-16" y="-10" fill="#00F0FF" fontSize="10" fontWeight="bold">+</text>
        </g>
      )}

      {type === 'transistor_npn' && (
        <g>
          {/* Base lead */}
          <line x1="-25" y1="0" x2="-8" y2="0" stroke="#00F0FF" strokeWidth="2" />
          {/* Vertical base bar */}
          <line x1="-8" y1="-16" x2="-8" y2="16" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />

          {/* Collector slant */}
          <line x1="-8" y1="-8" x2="16" y2="-20" stroke="#00F0FF" strokeWidth="2" />
          <line x1="16" y1="-20" x2="25" y2="-25" stroke="#00F0FF" strokeWidth="2" />

          {/* Emitter slant with arrow */}
          <line x1="-8" y1="8" x2="16" y2="20" stroke="#00F0FF" strokeWidth="2" />
          <line x1="16" y1="20" x2="25" y2="25" stroke="#00F0FF" strokeWidth="2" />
          {/* Arrow pointing away from base (NPN) */}
          <polygon points="12,17 18,21 16,15" fill="#00F0FF" />

          {/* Package circle */}
          <circle cx="2" cy="0" r="22" fill="none" stroke="#232B3E" strokeWidth="1.5" />
        </g>
      )}

      {type === 'ground' && (
        <g>
          <line x1="0" y1="-25" x2="0" y2="0" stroke="#10B981" strokeWidth="2.5" />
          {/* Earth ground bars */}
          <line x1="-16" y1="0" x2="16" y2="0" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="-10" y1="6" x2="10" y2="6" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
          <line x1="-4" y1="12" x2="4" y2="12" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {type === 'arduino_uno' && (
        <g>
          {/* Microcontroller block */}
          <rect x="-75" y="-70" width="150" height="140" rx="4" fill="#131B2E" stroke="#00F0FF" strokeWidth="2" />
          <rect x="-75" y="-70" width="150" height="20" fill="#1E293B" />
          <text x="0" y="-55" textAnchor="middle" fill="#00F0FF" fontSize="11" fontWeight="bold" fontFamily="monospace">
            ARDUINO UNO
          </text>
        </g>
      )}

      {/* DESIGNATOR & VALUE LABELS */}
      <g transform="translate(0, -22)" className="pointer-events-none">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fill="#F8FAFC"
          fontSize="11"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {designator}
        </text>
        <text
          x="0"
          y="12"
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="10"
          fontFamily="monospace"
        >
          {getValueText()}
        </text>
      </g>

      {/* TERMINAL PINS (Interactive connection snap nodes) */}
      {component.pins.map((pin) => {
        const isHovered = hoveredPinId === `${component.id}:${pin.id}`;
        const isStartPin = activeWireStartPin?.componentId === component.id && activeWireStartPin?.pinId === pin.id;
        const pinVoltage = simResult?.pinVoltages[pin.id];

        return (
          <g
            key={pin.id}
            transform={`translate(${pin.schematicOffset.x}, ${pin.schematicOffset.y})`}
            onClick={(e) => {
              e.stopPropagation();
              onPinMouseDown?.(pin.id, e);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              if (activeWireStartPin && (activeWireStartPin.componentId !== component.id || activeWireStartPin.pinId !== pin.id)) {
                onPinMouseDown?.(pin.id, e);
              }
            }}
            className="cursor-crosshair group pointer-events-auto"
          >
            {/* Generous invisible hit target circle (32px diameter) */}
            <circle cx="0" cy="0" r="16" fill="transparent" className="cursor-crosshair" />

            {/* Halo */}
            <circle
              cx="0"
              cy="0"
              r={isHovered || isStartPin ? 10 : 6}
              fill={isStartPin ? '#10B981' : isHovered ? '#00F0FF' : '#090B10'}
              stroke={isStartPin ? '#10B981' : isHovered ? '#00F0FF' : '#475569'}
              strokeWidth={isHovered || isStartPin ? 2.5 : 1.5}
            />
            {/* Pin dot */}
            <circle cx="0" cy="0" r={isHovered || isStartPin ? 3 : 2} fill={isStartPin ? '#FFF' : '#00F0FF'} />

            {/* Pin name tag */}
            <text
              x="0"
              y="14"
              textAnchor="middle"
              fill={isHovered ? '#00F0FF' : isStartPin ? '#10B981' : '#64748B'}
              fontSize="8"
              fontWeight={isHovered || isStartPin ? 'bold' : 'normal'}
              fontFamily="monospace"
              className="pointer-events-none select-none"
            >
              {isStartPin ? 'START' : pin.label || pin.name}
            </text>

            {/* Voltage readout */}
            {isSimulating && isHovered && pinVoltage !== undefined && (
              <g transform="translate(0, -16)" className="pointer-events-none">
                <rect x="-24" y="-12" width="48" height="15" rx="2" fill="#090B10" stroke="#00F0FF" strokeWidth="1" />
                <text x="0" y="-2" textAnchor="middle" fill="#00F0FF" fontSize="9" fontWeight="bold" fontFamily="monospace">
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
