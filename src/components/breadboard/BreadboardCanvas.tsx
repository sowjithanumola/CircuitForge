import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  CircuitComponent,
  Wire,
  WireColor,
  SimulationState,
  ViewportTransform,
} from '../../types/circuit';
import { BreadboardComponentItem } from './BreadboardComponents';
import { ZoomIn, ZoomOut, Maximize2, RotateCw, Trash2, Eye } from 'lucide-react';

interface BreadboardCanvasProps {
  components: CircuitComponent[];
  wires: Wire[];
  selectedComponentId: string | null;
  selectedWireId: string | null;
  activeWireColor: WireColor;
  simulationState: SimulationState;
  viewport: ViewportTransform;
  onSelectComponent: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onUpdateComponentPos: (id: string, pos: { x: number; y: number }) => void;
  onRotateComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onAddWire: (wire: Wire) => void;
  onDeleteWire: (id: string) => void;
  onUpdateViewport: (viewport: ViewportTransform) => void;
}

export const BreadboardCanvas: React.FC<BreadboardCanvasProps> = ({
  components,
  wires,
  selectedComponentId,
  selectedWireId,
  activeWireColor,
  simulationState,
  viewport,
  onSelectComponent,
  onSelectWire,
  onUpdateComponentPos,
  onRotateComponent,
  onDeleteComponent,
  onAddWire,
  onDeleteWire,
  onUpdateViewport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Interaction states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Wire drawing state
  const [activeWireStart, setActiveWireStart] = useState<{
    componentId: string;
    pinId: string;
    x: number;
    y: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState<{ componentId: string; pinId: string } | null>(null);
  const [showBreadboardBase, setShowBreadboardBase] = useState(true);

  // Helper to get screen to SVG world coordinates
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (clientY - rect.top - viewport.y) / viewport.zoom;
    return { x, y };
  }, [viewport]);

  // Compute pin absolute position
  const getPinPos = useCallback((comp: CircuitComponent, pinId: string) => {
    const pin = comp.pins.find(p => p.id === pinId);
    if (!pin) return { x: comp.breadboardPos.x, y: comp.breadboardPos.y };

    // Apply rotation
    const rad = (comp.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rotX = pin.breadboardOffset.x * cos - pin.breadboardOffset.y * sin;
    const rotY = pin.breadboardOffset.x * sin + pin.breadboardOffset.y * cos;

    return {
      x: comp.breadboardPos.x + rotX,
      y: comp.breadboardPos.y + rotY,
    };
  }, []);

  // Handle canvas mouse events for panning & wire drawing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === svgRef.current)) {
      // Pan canvas
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      onSelectComponent(null);
      onSelectWire(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(coords);

    if (isPanning) {
      onUpdateViewport({
        ...viewport,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingCompId) {
      // Snap to 10px grid
      const rawX = coords.x - dragOffset.x;
      const rawY = coords.y - dragOffset.y;
      const snappedX = Math.round(rawX / 10) * 10;
      const snappedY = Math.round(rawY / 10) * 10;
      onUpdateComponentPos(draggingCompId, { x: snappedX, y: snappedY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingCompId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(2.5, Math.max(0.4, viewport.zoom * zoomFactor));

    // Zoom towards cursor
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const dx = (mouseX - viewport.x) * (1 - zoomFactor);
      const dy = (mouseY - viewport.y) * (1 - zoomFactor);

      onUpdateViewport({
        x: viewport.x + dx,
        y: viewport.y + dy,
        zoom: Number(newZoom.toFixed(2)),
      });
    }
  };

  // Pin connection handling
  const handlePinMouseDown = (componentId: string, pinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const comp = components.find(c => c.id === componentId);
    if (!comp) return;

    const pinPos = getPinPos(comp, pinId);

    if (!activeWireStart) {
      // Start wire
      setActiveWireStart({
        componentId,
        pinId,
        x: pinPos.x,
        y: pinPos.y,
      });
    } else {
      // If clicking same pin again, cancel wire
      if (activeWireStart.componentId === componentId && activeWireStart.pinId === pinId) {
        setActiveWireStart(null);
        return;
      }

      // Complete wire
      const newWire: Wire = {
        id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fromComponentId: activeWireStart.componentId,
        fromPinId: activeWireStart.pinId,
        toComponentId: componentId,
        toPinId: pinId,
        color: activeWireColor,
      };
      onAddWire(newWire);
      setActiveWireStart(null);
    }
  };

  // Cancel wire on background click
  const handleSvgClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current && activeWireStart) {
      setActiveWireStart(null);
    }
  };

  // Standard Breadboard Grid (830 tie-points: 30 columns x (2 rails + 5 top rows + 5 bottom rows + 2 rails))
  const breadboardGeometry = useMemo(() => {
    const startX = 220;
    const startY = 80;
    const colCount = 30;
    const colSpacing = 20;

    const topPower: Array<{ col: number; x: number; yPos: number; yNeg: number }> = [];
    const mainCols: Array<{ col: number; x: number; holes: Array<{ letter: string; x: number; y: number }> }> = [];
    const botPower: Array<{ col: number; x: number; yPos: number; yNeg: number }> = [];

    // Columns 1..30
    for (let c = 1; c <= colCount; c++) {
      const cx = startX + (c - 1) * colSpacing;
      // Top power rails (+, -)
      topPower.push({ col: c, x: cx, yPos: startY + 15, yNeg: startY + 35 });
      // Terminal rows A..E and F..J
      const holes: Array<{ letter: string; x: number; y: number }> = [];
      const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      rowLetters.forEach((letter, rIdx) => {
        // Leave groove gap between E (idx 4) and F (idx 5)
        const troughOffset = rIdx >= 5 ? 26 : 0;
        const cy = startY + 65 + rIdx * 18 + troughOffset;
        holes.push({ letter, x: cx, y: cy });
      });
      mainCols.push({ col: c, x: cx, holes });
      // Bottom power rails (+, -)
      botPower.push({ col: c, x: cx, yPos: startY + 285, yNeg: startY + 305 });
    }

    return { startX, startY, width: colCount * colSpacing + 40, height: 340, topPower, mainCols, botPower };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#090B10] overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Floating Canvas Viewport & Tool Overlay */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#131720]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#232B3E] shadow-xl">
        <button
          onClick={() => setShowBreadboardBase(!showBreadboardBase)}
          title="Toggle Breadboard Base"
          className={`p-1.5 rounded text-xs flex items-center gap-1 font-mono transition-colors ${
            showBreadboardBase ? 'bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/40' : 'text-slate-400 hover:bg-[#1E293B]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Breadboard</span>
        </button>

        <div className="h-4 w-px bg-[#232B3E]" />

        <button
          onClick={() => onUpdateViewport({ ...viewport, zoom: Math.min(2.5, viewport.zoom + 0.15) })}
          title="Zoom In"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono text-slate-400 min-w-[45px] text-center">
          {Math.round(viewport.zoom * 100)}%
        </span>

        <button
          onClick={() => onUpdateViewport({ ...viewport, zoom: Math.max(0.4, viewport.zoom - 0.15) })}
          title="Zoom Out"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => onUpdateViewport({ x: 40, y: 30, zoom: 1.0 })}
          title="Reset View"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {selectedComponentId && (
          <>
            <div className="h-4 w-px bg-[#232B3E]" />
            <button
              onClick={() => onRotateComponent(selectedComponentId)}
              title="Rotate Component (R)"
              className="p-1.5 text-[#00F0FF] hover:bg-cyan-500/20 rounded transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteComponent(selectedComponentId)}
              title="Delete Component (Del)"
              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}

        {selectedWireId && (
          <>
            <div className="h-4 w-px bg-[#232B3E]" />
            <button
              onClick={() => onDeleteWire(selectedWireId)}
              title="Delete Wire (Del)"
              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors flex items-center gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wire</span>
            </button>
          </>
        )}
      </div>

      {/* Wire in progress tip */}
      {activeWireStart && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-cyan-950/90 border border-cyan-500/50 text-[#00F0FF] px-4 py-2 rounded-lg text-xs font-mono shadow-2xl flex items-center gap-2 animate-pulse">
          <span>Click a target pin or connection hole to complete jumper wire. Press ESC to cancel.</span>
        </div>
      )}

      {/* SVG Canvas Workspace */}
      <svg
        ref={svgRef}
        id="circuitforge-breadboard-svg"
        className="w-full h-full block"
        onClick={handleSvgClick}
      >
        <defs>
          {/* Engineering grid pattern */}
          <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#1C2333" />
          </pattern>
        </defs>

        {/* Infinite Grid Background */}
        <rect width="100%" height="100%" fill="url(#grid-dots)" />

        {/* Viewport Transform Group */}
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* REALISTIC SOLDERLESS BREADBOARD BASE */}
          {showBreadboardBase && (
            <g id="solderless-breadboard" className="select-none">
              {/* Outer Breadboard Plate (Off-white / cream plastic with beveled edges) */}
              <rect
                x={breadboardGeometry.startX - 20}
                y={breadboardGeometry.startY - 15}
                width={breadboardGeometry.width}
                height={breadboardGeometry.height}
                rx="12"
                fill="#E2E8F0"
                stroke="#CBD5E1"
                strokeWidth="2"
                className="drop-shadow-2xl"
              />

              {/* Side Interlock Notches */}
              <rect x={breadboardGeometry.startX - 25} y={breadboardGeometry.startY + 100} width="6" height="30" rx="2" fill="#CBD5E1" />
              <rect x={breadboardGeometry.startX - 25} y={breadboardGeometry.startY + 200} width="6" height="30" rx="2" fill="#CBD5E1" />
              <rect x={breadboardGeometry.startX + breadboardGeometry.width - 2} y={breadboardGeometry.startY + 100} width="6" height="30" rx="2" fill="#CBD5E1" />
              <rect x={breadboardGeometry.startX + breadboardGeometry.width - 2} y={breadboardGeometry.startY + 200} width="6" height="30" rx="2" fill="#CBD5E1" />

              {/* Center Divider Trough (DIP IC slot) */}
              <rect
                x={breadboardGeometry.startX - 10}
                y={breadboardGeometry.startY + 155}
                width={breadboardGeometry.width - 20}
                height="16"
                fill="#CBD5E1"
                stroke="#94A3B8"
                strokeWidth="1"
              />

              {/* Top Power Rail Stripes (+ Red, - Blue) */}
              <line
                x1={breadboardGeometry.startX}
                y1={breadboardGeometry.startY + 15}
                x2={breadboardGeometry.startX + breadboardGeometry.width - 40}
                y2={breadboardGeometry.startY + 15}
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeDasharray="18 4"
                opacity="0.85"
              />
              <line
                x1={breadboardGeometry.startX}
                y1={breadboardGeometry.startY + 35}
                x2={breadboardGeometry.startX + breadboardGeometry.width - 40}
                y2={breadboardGeometry.startY + 35}
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeDasharray="18 4"
                opacity="0.85"
              />
              <text x={breadboardGeometry.startX - 12} y={breadboardGeometry.startY + 19} fill="#EF4444" fontSize="12" fontWeight="bold">+</text>
              <text x={breadboardGeometry.startX - 12} y={breadboardGeometry.startY + 38} fill="#3B82F6" fontSize="12" fontWeight="bold">-</text>

              {/* Bottom Power Rail Stripes (+ Red, - Blue) */}
              <line
                x1={breadboardGeometry.startX}
                y1={breadboardGeometry.startY + 285}
                x2={breadboardGeometry.startX + breadboardGeometry.width - 40}
                y2={breadboardGeometry.startY + 285}
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeDasharray="18 4"
                opacity="0.85"
              />
              <line
                x1={breadboardGeometry.startX}
                y1={breadboardGeometry.startY + 305}
                x2={breadboardGeometry.startX + breadboardGeometry.width - 40}
                y2={breadboardGeometry.startY + 305}
                stroke="#3B82F6"
                strokeWidth="1.5"
                strokeDasharray="18 4"
                opacity="0.85"
              />
              <text x={breadboardGeometry.startX - 12} y={breadboardGeometry.startY + 289} fill="#EF4444" fontSize="12" fontWeight="bold">+</text>
              <text x={breadboardGeometry.startX - 12} y={breadboardGeometry.startY + 308} fill="#3B82F6" fontSize="12" fontWeight="bold">-</text>

              {/* Power Holes */}
              {breadboardGeometry.topPower.map((tp) => (
                <g key={`tp_${tp.col}`}>
                  <rect x={tp.x - 3} y={tp.yPos - 3} width="6" height="6" rx="1.5" fill="#475569" stroke="#1E293B" strokeWidth="0.8" />
                  <rect x={tp.x - 3} y={tp.yNeg - 3} width="6" height="6" rx="1.5" fill="#475569" stroke="#1E293B" strokeWidth="0.8" />
                </g>
              ))}
              {breadboardGeometry.botPower.map((bp) => (
                <g key={`bp_${bp.col}`}>
                  <rect x={bp.x - 3} y={bp.yPos - 3} width="6" height="6" rx="1.5" fill="#475569" stroke="#1E293B" strokeWidth="0.8" />
                  <rect x={bp.x - 3} y={bp.yNeg - 3} width="6" height="6" rx="1.5" fill="#475569" stroke="#1E293B" strokeWidth="0.8" />
                </g>
              ))}

              {/* Column labels & Terminal Holes */}
              {breadboardGeometry.mainCols.map((col) => (
                <g key={`col_${col.col}`}>
                  {/* Column number at top and bottom */}
                  {col.col % 5 === 0 || col.col === 1 ? (
                    <>
                      <text x={col.x} y={breadboardGeometry.startY + 55} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">
                        {col.col}
                      </text>
                      <text x={col.x} y={breadboardGeometry.startY + 275} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">
                        {col.col}
                      </text>
                    </>
                  ) : null}

                  {/* 10 Terminal Holes (A..J) */}
                  {col.holes.map((hole) => (
                    <rect
                      key={`h_${col.col}_${hole.letter}`}
                      x={hole.x - 3.5}
                      y={hole.y - 3.5}
                      width="7"
                      height="7"
                      rx="1.5"
                      fill="#334155"
                      stroke="#0F172A"
                      strokeWidth="0.8"
                    />
                  ))}
                </g>
              ))}

              {/* Row Letters (A..J) on left edge */}
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((letter, rIdx) => {
                const troughOffset = rIdx >= 5 ? 26 : 0;
                const cy = breadboardGeometry.startY + 65 + rIdx * 18 + troughOffset;
                return (
                  <g key={`letter_${letter}`}>
                    <text x={breadboardGeometry.startX - 10} y={cy + 3} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">
                      {letter}
                    </text>
                    <text x={breadboardGeometry.startX + breadboardGeometry.width - 30} y={cy + 3} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="monospace">
                      {letter}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* WIRES (Curved jumper wires with metal terminals) */}
          {wires.map((wire) => {
            const fromComp = components.find(c => c.id === wire.fromComponentId);
            const toComp = components.find(c => c.id === wire.toComponentId);
            if (!fromComp || !toComp) return null;

            const p1 = getPinPos(fromComp, wire.fromPinId);
            const p2 = getPinPos(toComp, wire.toPinId);

            // Calculate natural sagging arc curve
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.hypot(dx, dy);
            // Arc sag height proportional to distance
            const sag = Math.min(80, Math.max(30, dist * 0.25));

            // Control point for quadratic/cubic bezier
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 + sag;
            const pathData = `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;

            const isSelected = selectedWireId === wire.id;
            const current = simulationState.wireCurrents[wire.id] || 0;
            const isFlowing = simulationState.isRunning && Math.abs(current) > 1e-4;

            return (
              <g
                key={wire.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectWire(wire.id);
                  onSelectComponent(null);
                }}
                className="cursor-pointer group"
              >
                {/* Wider invisible stroke for easy click selection */}
                <path d={pathData} stroke="transparent" strokeWidth="16" fill="none" />

                {/* Selection halo */}
                {isSelected && (
                  <path
                    d={pathData}
                    stroke="#00F0FF"
                    strokeWidth="8"
                    strokeOpacity="0.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                )}

                {/* Realistic wire shadow */}
                <path
                  d={`M ${p1.x} ${p1.y + 4} Q ${midX} ${midY + 8} ${p2.x} ${p2.y + 4}`}
                  stroke="#000000"
                  strokeWidth="4"
                  strokeOpacity="0.3"
                  fill="none"
                  strokeLinecap="round"
                />

                {/* Wire insulation sheath */}
                <path
                  d={pathData}
                  stroke={wire.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all"
                />

                {/* Animated current flow indicators if active */}
                {isFlowing && (
                  <path
                    d={pathData}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeDasharray="4 8"
                    strokeLinecap="round"
                    fill="none"
                    className="animate-current-flow opacity-90"
                  />
                )}

                {/* Metal DuPont terminal ends */}
                <circle cx={p1.x} cy={p1.y} r="3.5" fill="#64748B" stroke="#0F172A" strokeWidth="1" />
                <circle cx={p2.x} cy={p2.y} r="3.5" fill="#64748B" stroke="#0F172A" strokeWidth="1" />
              </g>
            );
          })}

          {/* WIRE CURRENTLY BEING DRAWN */}
          {activeWireStart && (
            <g className="pointer-events-none">
              {/* Dynamic curved dashed preview wire */}
              <path
                d={`M ${activeWireStart.x} ${activeWireStart.y} Q ${(activeWireStart.x + mousePos.x) / 2} ${(activeWireStart.y + mousePos.y) / 2 + 40} ${mousePos.x} ${mousePos.y}`}
                stroke={activeWireColor}
                strokeWidth="3"
                strokeDasharray="5 3"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
              <circle cx={mousePos.x} cy={mousePos.y} r="4" fill={activeWireColor} stroke="#FFF" strokeWidth="1.5" />
            </g>
          )}

          {/* COMPONENTS */}
          {components.map((comp) => {
            const isSelected = selectedComponentId === comp.id;
            const simResult = simulationState.results[comp.id];

            return (
              <g
                key={comp.id}
                onMouseDown={(e) => {
                  if (activeWireStart) return;
                  e.stopPropagation();
                  onSelectComponent(comp.id);
                  onSelectWire(null);
                  setDraggingCompId(comp.id);
                  const coords = getCanvasCoords(e.clientX, e.clientY);
                  setDragOffset({
                    x: coords.x - comp.breadboardPos.x,
                    y: coords.y - comp.breadboardPos.y,
                  });
                }}
              >
                <BreadboardComponentItem
                  component={comp}
                  isSelected={isSelected}
                  simResult={simResult}
                  onPinMouseDown={(pinId, e) => handlePinMouseDown(comp.id, pinId, e)}
                  hoveredPinId={hoveredPin ? `${hoveredPin.componentId}:${hoveredPin.pinId}` : null}
                  activeWireStartPin={activeWireStart ? { componentId: activeWireStart.componentId, pinId: activeWireStart.pinId } : null}
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
