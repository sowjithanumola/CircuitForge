export type EditorMode = 'breadboard' | 'schematic';

export type ComponentType =
  | 'resistor'
  | 'led'
  | 'dc_source'
  | 'battery_9v'
  | 'switch_spst'
  | 'push_button'
  | 'capacitor'
  | 'diode'
  | 'ground'
  | 'transistor_npn'
  | 'arduino_uno'
  | 'potentiometer';

export type WireColor =
  | '#EF4444' // Red (VCC/Positive)
  | '#10B981' // Green
  | '#3B82F6' // Blue
  | '#F59E0B' // Yellow / Amber
  | '#64748B' // Slate / Gray
  | '#0F172A' // Dark / Black (GND)
  | '#8B5CF6' // Violet
  | '#EC4899' // Pink
  | '#F97316'; // Orange

export interface PinDefinition {
  id: string;
  name: string;
  label?: string;
  // Offset relative to component center in breadboard mode (in mm or grid units)
  breadboardOffset: { x: number; y: number };
  // Offset relative to component center in schematic mode
  schematicOffset: { x: number; y: number };
  type: 'terminal' | 'anode' | 'cathode' | 'positive' | 'negative' | 'ground' | 'base' | 'collector' | 'emitter' | 'wiper';
}

export interface ComponentProperties {
  resistance?: number; // Ohms
  resistanceUnit?: 'Ω' | 'kΩ' | 'MΩ';
  voltage?: number; // Volts
  capacitance?: number; // Farads or microfarads
  capacitanceUnit?: 'pF' | 'nF' | 'µF';
  ledColor?: 'red' | 'green' | 'blue' | 'amber' | 'white';
  forwardVoltage?: number; // Volts (typical 2.0V red, 3.2V blue)
  maxCurrent?: number; // Amperes (typical 0.03A = 30mA)
  switchClosed?: boolean; // SPST state
  buttonPressed?: boolean; // Momentary push button
  potentiometerRatio?: number; // 0 to 1
  model?: string;
  colorBands?: string[];
  powerRating?: number; // Watts (default 0.25W)
  description?: string;
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  designator: string; // e.g. R1, D1, V1, SW1, C1
  breadboardPos: { x: number; y: number };
  schematicPos: { x: number; y: number };
  rotation: number; // 0, 90, 180, 270 degrees
  mirrored?: boolean;
  properties: ComponentProperties;
  pins: PinDefinition[];
}

export interface Wire {
  id: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  color: WireColor;
  breadboardWaypoints?: { x: number; y: number }[];
  schematicWaypoints?: { x: number; y: number }[];
}

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  activeMode: EditorMode;
  components: CircuitComponent[];
  wires: Wire[];
  breadboardView: ViewportTransform;
  schematicView: ViewportTransform;
}

export interface PinMeasurement {
  pinId: string;
  voltage: number;
}

export interface ComponentSimulationResult {
  componentId: string;
  voltageDrop: number; // V
  current: number; // A (positive = from pin 0 to pin 1)
  power: number; // W
  status: 'normal' | 'active' | 'off' | 'overcurrent' | 'reverse_biased' | 'short_circuit';
  statusMessage?: string;
  brightness?: number; // 0 to 1 for LEDs
  pinVoltages: Record<string, number>;
}

export interface SimulationDiagnostics {
  status: 'running' | 'paused' | 'stopped' | 'error';
  isSolvable: boolean;
  hasVoltageSource: boolean;
  hasGround: boolean;
  shortCircuits: string[];
  openCircuits: string[];
  warnings: string[];
  errors: string[];
  totalPower: number; // Watts
  nodeCount: number;
  branchCount: number;
}

export interface SimulationState {
  isRunning: boolean;
  stepCount: number;
  results: Record<string, ComponentSimulationResult>;
  wireCurrents: Record<string, number>; // Wire ID -> current in Amperes
  diagnostics: SimulationDiagnostics;
}
