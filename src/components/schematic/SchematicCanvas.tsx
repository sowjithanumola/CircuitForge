import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  CircuitComponent,
  Wire,
  WireColor,
  SimulationState,
  ViewportTransform,
} from '../../types/circuit';
import { SchematicSymbolItem } from './SchematicSymbols';
import { ZoomIn, ZoomOut, Maximize2, RotateCw, Trash2, Download } from 'lucide-react';
import { exportSvgElement, exportPngFromSvg } from '../../utils/export';

interface SchematicCanvasProps {
  projectName: string;
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

export const SchematicCanvas: React.FC<SchematicCanvasProps> = ({
  projectName,
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

  // Coordinate transforms
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (clientY - rect.top - viewport.y) / viewport.zoom;
    return { x, y };
  }, [viewport]);

  // Pin coordinate in schematic space
  const getPinPos = useCallback((comp: CircuitComponent, pinId: string) => {
    const pin = comp.pins.find(p => p.id === pinId);
    if (!pin) return { x: comp.schematicPos.x, y: comp.schematicPos.y };

    const rad = (comp.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rotX = pin.schematicOffset.x * cos - pin.schematicOffset.y * sin;
    const rotY = pin.schematicOffset.x * sin + pin.schematicOffset.y * cos;

    return {
      x: comp.schematicPos.x + rotX,
      y: comp.schematicPos.y + rotY,
    };
  }, []);

  // Compute orthogonal (Manhattan) route between two points
  const getOrthogonalPath = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    // If aligned vertically or horizontally, draw straight line
    if (Math.abs(p1.x - p2.x) < 2 || Math.abs(p1.y - p2.y) < 2) {
      return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
    }

    // Midpoint dogleg
    const midX = Math.round((p1.x + p2.x) / 2 / 20) * 20;
    return `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
  }, []);

  // Calculate junction dots where 3 or more wires share coordinates
  const junctionPoints = useMemo(() => {
    const counts = new Map<string, { x: number; y: number; count: number }>();

    wires.forEach(wire => {
      const fromComp = components.find(c => c.id === wire.fromComponentId);
      const toComp = components.find(c => c.id === wire.toComponentId);
      if (!fromComp || !toComp) return;

      const p1 = getPinPos(fromComp, wire.fromPinId);
      const p2 = getPinPos(toComp, wire.toPinId);

      const k1 = `${Math.round(p1.x)},${Math.round(p1.y)}`;
      const k2 = `${Math.round(p2.x)},${Math.round(p2.y)}`;

      counts.set(k1, { x: p1.x, y: p1.y, count: (counts.get(k1)?.count || 0) + 1 });
      counts.set(k2, { x: p2.x, y: p2.y, count: (counts.get(k2)?.count || 0) + 1 });
    });

    const junctions: Array<{ x: number; y: number }> = [];
    counts.forEach(val => {
      if (val.count >= 2) {
        junctions.push({ x: val.x, y: val.y });
      }
    });
    return junctions;
  }, [wires, components, getPinPos]);

  // Mouse pan/zoom events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === svgRef.current)) {
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
      // Snap to 20px schematic grid
      const rawX = coords.x - dragOffset.x;
      const rawY = coords.y - dragOffset.y;
      const snappedX = Math.round(rawX / 20) * 20;
      const snappedY = Math.round(rawY / 20) * 20;
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

  const handlePinMouseDown = (componentId: string, pinId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const comp = components.find(c => c.id === componentId);
    if (!comp) return;

    const pinPos = getPinPos(comp, pinId);

    if (!activeWireStart) {
      setActiveWireStart({
        componentId,
        pinId,
        x: pinPos.x,
        y: pinPos.y,
      });
    } else {
      if (activeWireStart.componentId === componentId && activeWireStart.pinId === pinId) {
        setActiveWireStart(null);
        return;
      }

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

  const handleSvgClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current && activeWireStart) {
      setActiveWireStart(null);
    }
  };

  // Export handlers
  const handleExportSvg = () => {
    if (svgRef.current) {
      exportSvgElement(svgRef.current, `${projectName.toLowerCase().replace(/\s+/g, '_')}_schematic`);
    }
  };

  const handleExportPng = () => {
    if (svgRef.current) {
      exportPngFromSvg(svgRef.current, `${projectName.toLowerCase().replace(/\s+/g, '_')}_schematic`);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#090B10] overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Top Right Floating Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#131720]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#232B3E] shadow-xl">
        <div className="flex items-center gap-1 text-xs text-slate-400 font-mono pr-2 border-r border-[#232B3E]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
          <span>IEEE Grid (20px)</span>
        </div>

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
          onClick={() => onUpdateViewport({ x: 50, y: 50, zoom: 1.0 })}
          title="Fit Screen"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-[#1E293B] rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#232B3E]" />

        <button
          onClick={handleExportSvg}
          title="Export Schematic as SVG"
          className="px-2 py-1 text-xs font-mono text-cyan-300 hover:bg-cyan-500/20 rounded transition-colors flex items-center gap-1 border border-cyan-500/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span>SVG</span>
        </button>

        <button
          onClick={handleExportPng}
          title="Export Schematic as PNG"
          className="px-2 py-1 text-xs font-mono text-cyan-300 hover:bg-cyan-500/20 rounded transition-colors flex items-center gap-1 border border-cyan-500/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PNG</span>
        </button>

        {selectedComponentId && (
          <>
            <div className="h-4 w-px bg-[#232B3E]" />
            <button
              onClick={() => onRotateComponent(selectedComponentId)}
              title="Rotate (R)"
              className="p-1.5 text-[#00F0FF] hover:bg-cyan-500/20 rounded transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteComponent(selectedComponentId)}
              title="Delete (Del)"
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
              title="Delete Wire"
              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Wire in progress tip */}
      {activeWireStart && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-cyan-950/90 border border-cyan-500/50 text-[#00F0FF] px-4 py-2 rounded-lg text-xs font-mono shadow-2xl flex items-center gap-2 animate-pulse">
          <span>Click target terminal to complete orthogonal wire. Press ESC to cancel.</span>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        id="circuitforge-schematic-svg"
        className="w-full h-full block"
        onClick={handleSvgClick}
      >
        <defs>
          {/* Schematic Dot Grid */}
          <pattern id="schematic-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.2" fill="#1C2433" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#schematic-grid)" />

        {/* Viewport Transform Group */}
        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* WIRES (Orthogonal Net Lines) */}
          {wires.map((wire) => {
            const fromComp = components.find(c => c.id === wire.fromComponentId);
            const toComp = components.find(c => c.id === wire.toComponentId);
            if (!fromComp || !toComp) return null;

            const p1 = getPinPos(fromComp, wire.fromPinId);
            const p2 = getPinPos(toComp, wire.toPinId);
            const pathData = getOrthogonalPath(p1, p2);

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
                {/* Thick hit area */}
                <path d={pathData} stroke="transparent" strokeWidth="14" fill="none" />

                {/* Selection halo */}
                {isSelected && (
                  <path
                    d={pathData}
                    stroke="#00F0FF"
                    strokeWidth="7"
                    strokeOpacity="0.4"
                    fill="none"
                  />
                )}

                {/* Orthogonal Net Line */}
                <path
                  d={pathData}
                  stroke="#00F0FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />

                {/* Current flow simulation animation */}
                {isFlowing && (
                  <path
                    d={pathData}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    className="animate-current-flow"
                  />
                )}
              </g>
            );
          })}

          {/* JUNCTION DOTS */}
          {junctionPoints.map((j, idx) => (
            <circle
              key={`j_${idx}`}
              cx={j.x}
              cy={j.y}
              r="4"
              fill="#00F0FF"
              className="pointer-events-none"
            />
          ))}

          {/* WIRE DRAWING PREVIEW */}
          {activeWireStart && (
            <g className="pointer-events-none">
              <path
                d={getOrthogonalPath(activeWireStart, mousePos)}
                stroke="#00F0FF"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
              <circle cx={mousePos.x} cy={mousePos.y} r="3.5" fill="#00F0FF" />
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
                    x: coords.x - comp.schematicPos.x,
                    y: coords.y - comp.schematicPos.y,
                  });
                }}
              >
                <SchematicSymbolItem
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
