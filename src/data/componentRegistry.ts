import { ComponentType, PinDefinition, ComponentProperties, CircuitComponent } from '../types/circuit';

export interface ComponentTemplate {
  type: ComponentType;
  name: string;
  category: 'Sources' | 'Passives' | 'Semiconductors' | 'Switches' | 'Modules';
  designatorPrefix: string;
  defaultProperties: ComponentProperties;
  pins: PinDefinition[];
  width: { breadboard: number; schematic: number };
  height: { breadboard: number; schematic: number };
  description: string;
}

export const COMPONENT_TEMPLATES: Record<ComponentType, ComponentTemplate> = {
  resistor: {
    type: 'resistor',
    name: 'Resistor',
    category: 'Passives',
    designatorPrefix: 'R',
    description: 'Restricts electric current flow and drops voltage according to Ohm\'s law (V = I * R).',
    defaultProperties: {
      resistance: 220,
      resistanceUnit: 'Ω',
      powerRating: 0.25,
    },
    width: { breadboard: 120, schematic: 100 },
    height: { breadboard: 28, schematic: 40 },
    pins: [
      {
        id: 'p1',
        name: 'Terminal 1',
        label: '1',
        breadboardOffset: { x: -50, y: 0 },
        schematicOffset: { x: -40, y: 0 },
        type: 'terminal',
      },
      {
        id: 'p2',
        name: 'Terminal 2',
        label: '2',
        breadboardOffset: { x: 50, y: 0 },
        schematicOffset: { x: 40, y: 0 },
        type: 'terminal',
      },
    ],
  },

  led: {
    type: 'led',
    name: 'Light Emitting Diode',
    category: 'Semiconductors',
    designatorPrefix: 'D',
    description: 'Emits light when forward biased with sufficient voltage. Requires current-limiting resistor.',
    defaultProperties: {
      ledColor: 'red',
      forwardVoltage: 2.0,
      maxCurrent: 0.03, // 30mA
    },
    width: { breadboard: 50, schematic: 90 },
    height: { breadboard: 60, schematic: 50 },
    pins: [
      {
        id: 'anode',
        name: 'Anode (+)',
        label: '+',
        breadboardOffset: { x: -15, y: 25 },
        schematicOffset: { x: -35, y: 0 },
        type: 'anode',
      },
      {
        id: 'cathode',
        name: 'Cathode (-)',
        label: '-',
        breadboardOffset: { x: 15, y: 25 },
        schematicOffset: { x: 35, y: 0 },
        type: 'cathode',
      },
    ],
  },

  battery_9v: {
    type: 'battery_9v',
    name: '9V Battery',
    category: 'Sources',
    designatorPrefix: 'BAT',
    description: 'Standard 9V DC chemical battery with snap connector terminals.',
    defaultProperties: {
      voltage: 9.0,
    },
    width: { breadboard: 100, schematic: 90 },
    height: { breadboard: 150, schematic: 60 },
    pins: [
      {
        id: 'pos',
        name: 'Positive (+)',
        label: '+',
        breadboardOffset: { x: -20, y: -65 },
        schematicOffset: { x: -35, y: 0 },
        type: 'positive',
      },
      {
        id: 'neg',
        name: 'Negative (-)',
        label: '-',
        breadboardOffset: { x: 20, y: -65 },
        schematicOffset: { x: 35, y: 0 },
        type: 'negative',
      },
    ],
  },

  dc_source: {
    type: 'dc_source',
    name: 'DC Power Supply',
    category: 'Sources',
    designatorPrefix: 'V',
    description: 'Regulated constant voltage DC power supply (adjustable 1V to 24V).',
    defaultProperties: {
      voltage: 5.0,
    },
    width: { breadboard: 90, schematic: 80 },
    height: { breadboard: 70, schematic: 70 },
    pins: [
      {
        id: 'pos',
        name: 'Positive (+)',
        label: '+',
        breadboardOffset: { x: -25, y: 0 },
        schematicOffset: { x: 0, y: -30 },
        type: 'positive',
      },
      {
        id: 'neg',
        name: 'Negative (-)',
        label: '-',
        breadboardOffset: { x: 25, y: 0 },
        schematicOffset: { x: 0, y: 30 },
        type: 'negative',
      },
    ],
  },

  switch_spst: {
    type: 'switch_spst',
    name: 'Toggle Switch',
    category: 'Switches',
    designatorPrefix: 'SW',
    description: 'Single Pole Single Throw (SPST) latching on/off mechanical switch.',
    defaultProperties: {
      switchClosed: false,
    },
    width: { breadboard: 70, schematic: 80 },
    height: { breadboard: 40, schematic: 40 },
    pins: [
      {
        id: 't1',
        name: 'Contact 1',
        label: '1',
        breadboardOffset: { x: -25, y: 0 },
        schematicOffset: { x: -30, y: 0 },
        type: 'terminal',
      },
      {
        id: 't2',
        name: 'Contact 2',
        label: '2',
        breadboardOffset: { x: 25, y: 0 },
        schematicOffset: { x: 30, y: 0 },
        type: 'terminal',
      },
    ],
  },

  push_button: {
    type: 'push_button',
    name: 'Push Button',
    category: 'Switches',
    designatorPrefix: 'PB',
    description: 'Normally open momentary tactile push button switch.',
    defaultProperties: {
      buttonPressed: false,
    },
    width: { breadboard: 60, schematic: 80 },
    height: { breadboard: 60, schematic: 50 },
    pins: [
      {
        id: 't1',
        name: 'Terminal 1',
        label: '1',
        breadboardOffset: { x: -20, y: 0 },
        schematicOffset: { x: -30, y: 0 },
        type: 'terminal',
      },
      {
        id: 't2',
        name: 'Terminal 2',
        label: '2',
        breadboardOffset: { x: 20, y: 0 },
        schematicOffset: { x: 30, y: 0 },
        type: 'terminal',
      },
    ],
  },

  capacitor: {
    type: 'capacitor',
    name: 'Capacitor',
    category: 'Passives',
    designatorPrefix: 'C',
    description: 'Stores electrical energy electrostatically in an electric field.',
    defaultProperties: {
      capacitance: 100,
      capacitanceUnit: 'µF',
    },
    width: { breadboard: 50, schematic: 80 },
    height: { breadboard: 60, schematic: 40 },
    pins: [
      {
        id: 'pos',
        name: 'Anode (+)',
        label: '+',
        breadboardOffset: { x: -15, y: 20 },
        schematicOffset: { x: -30, y: 0 },
        type: 'positive',
      },
      {
        id: 'neg',
        name: 'Cathode (-)',
        label: '-',
        breadboardOffset: { x: 15, y: 20 },
        schematicOffset: { x: 30, y: 0 },
        type: 'negative',
      },
    ],
  },

  diode: {
    type: 'diode',
    name: 'Diode (1N4007)',
    category: 'Semiconductors',
    designatorPrefix: 'D',
    description: 'General purpose silicon rectifier diode allowing current in forward direction only.',
    defaultProperties: {
      forwardVoltage: 0.7,
      maxCurrent: 1.0,
    },
    width: { breadboard: 90, schematic: 80 },
    height: { breadboard: 30, schematic: 40 },
    pins: [
      {
        id: 'anode',
        name: 'Anode',
        label: 'A',
        breadboardOffset: { x: -35, y: 0 },
        schematicOffset: { x: -30, y: 0 },
        type: 'anode',
      },
      {
        id: 'cathode',
        name: 'Cathode (Band)',
        label: 'K',
        breadboardOffset: { x: 35, y: 0 },
        schematicOffset: { x: 30, y: 0 },
        type: 'cathode',
      },
    ],
  },

  transistor_npn: {
    type: 'transistor_npn',
    name: 'NPN Transistor (2N2222)',
    category: 'Semiconductors',
    designatorPrefix: 'Q',
    description: 'Bipolar junction transistor for current amplification and digital electronic switching.',
    defaultProperties: {
      model: '2N2222',
    },
    width: { breadboard: 60, schematic: 80 },
    height: { breadboard: 70, schematic: 80 },
    pins: [
      {
        id: 'collector',
        name: 'Collector',
        label: 'C',
        breadboardOffset: { x: -15, y: 25 },
        schematicOffset: { x: 25, y: -25 },
        type: 'collector',
      },
      {
        id: 'base',
        name: 'Base',
        label: 'B',
        breadboardOffset: { x: 0, y: 25 },
        schematicOffset: { x: -25, y: 0 },
        type: 'base',
      },
      {
        id: 'emitter',
        name: 'Emitter',
        label: 'E',
        breadboardOffset: { x: 15, y: 25 },
        schematicOffset: { x: 25, y: 25 },
        type: 'emitter',
      },
    ],
  },

  ground: {
    type: 'ground',
    name: 'Ground Reference',
    category: 'Sources',
    designatorPrefix: 'GND',
    description: 'Common zero-volt (0V) reference point for circuit nodal potentials.',
    defaultProperties: {
      voltage: 0,
    },
    width: { breadboard: 50, schematic: 60 },
    height: { breadboard: 50, schematic: 60 },
    pins: [
      {
        id: 'gnd',
        name: 'Ground',
        label: 'GND',
        breadboardOffset: { x: 0, y: -15 },
        schematicOffset: { x: 0, y: -25 },
        type: 'ground',
      },
    ],
  },

  potentiometer: {
    type: 'potentiometer',
    name: 'Potentiometer',
    category: 'Passives',
    designatorPrefix: 'POT',
    description: 'Three-terminal adjustable rotary resistor for voltage division or tuning.',
    defaultProperties: {
      resistance: 10000,
      resistanceUnit: 'kΩ',
      potentiometerRatio: 0.5,
    },
    width: { breadboard: 70, schematic: 80 },
    height: { breadboard: 70, schematic: 60 },
    pins: [
      {
        id: 'p1',
        name: 'Terminal 1',
        label: '1',
        breadboardOffset: { x: -20, y: 25 },
        schematicOffset: { x: -30, y: 0 },
        type: 'terminal',
      },
      {
        id: 'wiper',
        name: 'Wiper',
        label: 'W',
        breadboardOffset: { x: 0, y: 25 },
        schematicOffset: { x: 0, y: 25 },
        type: 'wiper',
      },
      {
        id: 'p2',
        name: 'Terminal 2',
        label: '2',
        breadboardOffset: { x: 20, y: 25 },
        schematicOffset: { x: 30, y: 0 },
        type: 'terminal',
      },
    ],
  },

  arduino_uno: {
    type: 'arduino_uno',
    name: 'Arduino Uno Breakout',
    category: 'Modules',
    designatorPrefix: 'MCU',
    description: 'Microcontroller development board providing regulated 5V, 3.3V power and I/O pins.',
    defaultProperties: {
      voltage: 5.0,
    },
    width: { breadboard: 220, schematic: 180 },
    height: { breadboard: 160, schematic: 200 },
    pins: [
      {
        id: '5v',
        name: '5V Power',
        label: '5V',
        breadboardOffset: { x: -80, y: 65 },
        schematicOffset: { x: -75, y: -60 },
        type: 'positive',
      },
      {
        id: '3v3',
        name: '3.3V Power',
        label: '3V3',
        breadboardOffset: { x: -60, y: 65 },
        schematicOffset: { x: -75, y: -30 },
        type: 'positive',
      },
      {
        id: 'gnd1',
        name: 'GND 1',
        label: 'GND',
        breadboardOffset: { x: -40, y: 65 },
        schematicOffset: { x: -75, y: 0 },
        type: 'ground',
      },
      {
        id: 'gnd2',
        name: 'GND 2',
        label: 'GND',
        breadboardOffset: { x: -20, y: 65 },
        schematicOffset: { x: -75, y: 30 },
        type: 'ground',
      },
      {
        id: 'd13',
        name: 'Pin D13',
        label: 'D13',
        breadboardOffset: { x: 60, y: -65 },
        schematicOffset: { x: 75, y: -60 },
        type: 'terminal',
      },
      {
        id: 'd9',
        name: 'Pin D9 (PWM)',
        label: 'D9',
        breadboardOffset: { x: 20, y: -65 },
        schematicOffset: { x: 75, y: -30 },
        type: 'terminal',
      },
      {
        id: 'd2',
        name: 'Pin D2',
        label: 'D2',
        breadboardOffset: { x: -20, y: -65 },
        schematicOffset: { x: 75, y: 0 },
        type: 'terminal',
      },
      {
        id: 'a0',
        name: 'Pin A0',
        label: 'A0',
        breadboardOffset: { x: 20, y: 65 },
        schematicOffset: { x: 75, y: 30 },
        type: 'terminal',
      },
    ],
  },
};

export function createComponent(
  type: ComponentType,
  pos: { x: number; y: number },
  existingCount: number = 0,
  customProperties?: Partial<ComponentProperties>
): CircuitComponent {
  const template = COMPONENT_TEMPLATES[type];
  const designator = `${template.designatorPrefix}${existingCount + 1}`;
  const id = `comp_${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    type,
    designator,
    breadboardPos: { ...pos },
    schematicPos: { ...pos },
    rotation: 0,
    properties: {
      ...template.defaultProperties,
      ...customProperties,
    },
    pins: JSON.parse(JSON.stringify(template.pins)),
  };
}
