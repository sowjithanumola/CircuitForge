import {
  CircuitComponent,
  Wire,
  SimulationState,
  ComponentSimulationResult,
  SimulationDiagnostics,
} from '../types/circuit';

// Disjoint Set Union (DSU) to group interconnected pins into electrical nodes
class DisjointSet {
  parent: Map<string, string> = new Map();

  find(item: string): string {
    if (!this.parent.has(item)) {
      this.parent.set(item, item);
      return item;
    }
    const p = this.parent.get(item)!;
    if (p === item) return item;
    const root = this.find(p);
    this.parent.set(item, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }
}

// Solve linear system A * x = b via Gaussian elimination with partial pivoting
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  // Deep clone to avoid mutating input
  const M = A.map(row => [...row]);
  const x = [...b];

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    let maxVal = Math.abs(M[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxVal) {
        maxVal = Math.abs(M[k][i]);
        maxRow = k;
      }
    }

    if (maxVal < 1e-12) {
      // Singular or ill-conditioned matrix
      return null;
    }

    // Swap rows
    if (maxRow !== i) {
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
      [x[i], x[maxRow]] = [x[maxRow], x[i]];
    }

    // Eliminate below
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j < n; j++) {
        M[k][j] -= factor * M[i][j];
      }
      x[k] -= factor * x[i];
    }
  }

  // Back substitution
  const result = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = x[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * result[j];
    }
    result[i] = sum / M[i][i];
  }

  return result;
}

export function simulateCircuit(
  components: CircuitComponent[],
  wires: Wire[],
  stepCount: number = 0,
  dt: number = 0.01 // 10ms time step for transient elements
): SimulationState {
  const diagnostics: SimulationDiagnostics = {
    status: 'running',
    isSolvable: true,
    hasVoltageSource: false,
    hasGround: false,
    shortCircuits: [],
    openCircuits: [],
    warnings: [],
    errors: [],
    totalPower: 0,
    nodeCount: 0,
    branchCount: 0,
  };

  const results: Record<string, ComponentSimulationResult> = {};
  const wireCurrents: Record<string, number> = {};

  if (components.length === 0) {
    return {
      isRunning: false,
      stepCount: 0,
      results: {},
      wireCurrents: {},
      diagnostics: {
        ...diagnostics,
        status: 'stopped',
        warnings: ['Empty canvas: Add components and connect them with wires to simulate.'],
      },
    };
  }

  // Step 1: Identify all pins and build connectivity graph using DSU
  const dsu = new DisjointSet();
  const allPinKeys: string[] = [];

  for (const comp of components) {
    for (const pin of comp.pins) {
      const key = `${comp.id}:${pin.id}`;
      allPinKeys.push(key);
      dsu.find(key); // Initialize in DSU
    }
  }

  // Union connected pins via wires
  for (const wire of wires) {
    const fromKey = `${wire.fromComponentId}:${wire.fromPinId}`;
    const toKey = `${wire.toComponentId}:${wire.toPinId}`;
    dsu.union(fromKey, toKey);
  }

  // Step 2: Group pins into unique electrical nodes
  const nodeMap = new Map<string, number>(); // Root pin key -> Node index
  let groundRootKey: string | null = null;

  // Check for explicit ground components
  for (const comp of components) {
    if (comp.type === 'ground') {
      const gndPinKey = `${comp.id}:gnd`;
      groundRootKey = dsu.find(gndPinKey);
      diagnostics.hasGround = true;
      break;
    }
  }

  // If no explicit ground, find negative terminal of first voltage source or battery
  if (!groundRootKey) {
    for (const comp of components) {
      if (comp.type === 'battery_9v' || comp.type === 'dc_source') {
        groundRootKey = dsu.find(`${comp.id}:neg`);
        break;
      }
      if (comp.type === 'arduino_uno') {
        groundRootKey = dsu.find(`${comp.id}:gnd1`);
        break;
      }
    }
  }

  // If still no ground, select root of first pin as reference Node 0
  if (!groundRootKey && allPinKeys.length > 0) {
    groundRootKey = dsu.find(allPinKeys[0]);
  }

  // Assign Node 0 to ground
  if (groundRootKey) {
    nodeMap.set(groundRootKey, 0);
  }

  let nextNodeIdx = 1;
  for (const pinKey of allPinKeys) {
    const root = dsu.find(pinKey);
    if (!nodeMap.has(root)) {
      nodeMap.set(root, nextNodeIdx++);
    }
  }

  // Map each pin key to its node index
  const pinNode = (compId: string, pinId: string): number => {
    const key = `${compId}:${pinId}`;
    const root = dsu.find(key);
    return nodeMap.get(root) ?? 0;
  };

  const totalElectricalNodes = nodeMap.size;
  diagnostics.nodeCount = totalElectricalNodes;

  // Identify sources and check for trivial shorts
  const vSources: Array<{
    comp: CircuitComponent;
    posNode: number;
    negNode: number;
    voltage: number;
  }> = [];

  for (const comp of components) {
    if (comp.type === 'battery_9v') {
      diagnostics.hasVoltageSource = true;
      const pos = pinNode(comp.id, 'pos');
      const neg = pinNode(comp.id, 'neg');
      const v = comp.properties.voltage ?? 9.0;
      if (pos === neg && wires.length > 0) {
        diagnostics.shortCircuits.push(`9V Battery ${comp.designator} is short-circuited directly (+ connected to -).`);
      }
      vSources.push({ comp, posNode: pos, negNode: neg, voltage: v });
    } else if (comp.type === 'dc_source') {
      diagnostics.hasVoltageSource = true;
      const pos = pinNode(comp.id, 'pos');
      const neg = pinNode(comp.id, 'neg');
      const v = comp.properties.voltage ?? 5.0;
      if (pos === neg && wires.length > 0) {
        diagnostics.shortCircuits.push(`DC Source ${comp.designator} is short-circuited directly.`);
      }
      vSources.push({ comp, posNode: pos, negNode: neg, voltage: v });
    } else if (comp.type === 'arduino_uno') {
      diagnostics.hasVoltageSource = true;
      const pos5 = pinNode(comp.id, '5v');
      const gnd = pinNode(comp.id, 'gnd1');
      vSources.push({ comp, posNode: pos5, negNode: gnd, voltage: 5.0 });
      const pos33 = pinNode(comp.id, '3v3');
      vSources.push({ comp, posNode: pos33, negNode: gnd, voltage: 3.3 });
    }
  }

  if (!diagnostics.hasVoltageSource) {
    diagnostics.warnings.push('No voltage source present in circuit. Add a 9V Battery or DC Power Supply.');
  }

  // Modified Nodal Analysis (MNA)
  // Number of non-ground nodes = (totalElectricalNodes > 1 ? totalElectricalNodes - 1 : 0)
  const nonGroundNodes = Math.max(0, totalElectricalNodes - 1);
  const numSources = vSources.length;
  const matrixSize = nonGroundNodes + numSources;

  // If there are no voltage sources or no non-ground nodes, all electrical potentials are 0
  if (numSources === 0 || nonGroundNodes === 0 || matrixSize === 0) {
    for (const comp of components) {
      results[comp.id] = {
        componentId: comp.id,
        voltageDrop: 0,
        current: 0,
        power: 0,
        status: 'off',
        statusMessage: numSources === 0 ? 'No voltage source connected' : 'Circuit idle',
        pinVoltages: comp.pins.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
      };
    }
    return {
      isRunning: true,
      stepCount,
      results,
      wireCurrents,
      diagnostics: { ...diagnostics, isSolvable: false },
    };
  }

  // Iterative solver for non-linear components (LEDs, Diodes)
  const diodeLinearStates: Map<string, { g: number; Ieq: number }> = new Map();
  for (const comp of components) {
    if (comp.type === 'led' || comp.type === 'diode') {
      diodeLinearStates.set(comp.id, { g: 1e-6, Ieq: 0 }); // Initial small conductance
    }
  }

  let finalSolution: number[] | null = null;
  const MAX_ITER = 8;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    // Construct MNA matrix A and RHS vector z
    const A: number[][] = Array.from({ length: matrixSize }, () => new Array(matrixSize).fill(0));
    const z: number[] = new Array(matrixSize).fill(0);

    // Helper to add conductance between node u and node v with strict bounds checking
    const addConductance = (u: number, v: number, g: number) => {
      if (u !== 0 && v !== 0) {
        const i = u - 1;
        const j = v - 1;
        if (i >= 0 && i < matrixSize && j >= 0 && j < matrixSize && A[i] && A[j]) {
          A[i][i] += g;
          A[j][j] += g;
          A[i][j] -= g;
          A[j][i] -= g;
        }
      } else if (u !== 0) {
        const i = u - 1;
        if (i >= 0 && i < matrixSize && A[i]) {
          A[i][i] += g;
        }
      } else if (v !== 0) {
        const j = v - 1;
        if (j >= 0 && j < matrixSize && A[j]) {
          A[j][j] += g;
        }
      }
    };

    // Helper to add current source entering node u and leaving node v with strict bounds checking
    const addCurrentSource = (u: number, v: number, I: number) => {
      if (u !== 0 && u - 1 >= 0 && u - 1 < matrixSize) z[u - 1] += I;
      if (v !== 0 && v - 1 >= 0 && v - 1 < matrixSize) z[v - 1] -= I;
    };

    // Add high-resistance shunt to ground for every non-ground node to prevent floating singular matrices
    for (let k = 0; k < nonGroundNodes; k++) {
      A[k][k] += 1e-9; // 1 Gigaohm shunt to ground
    }

    // Stamp passive linear components
    for (const comp of components) {
      if (comp.type === 'resistor') {
        const n1 = pinNode(comp.id, 'p1');
        const n2 = pinNode(comp.id, 'p2');
        let r = comp.properties.resistance ?? 220;
        if (comp.properties.resistanceUnit === 'kΩ') r *= 1000;
        else if (comp.properties.resistanceUnit === 'MΩ') r *= 1000000;
        r = Math.max(0.01, r);
        addConductance(n1, n2, 1 / r);
      } else if (comp.type === 'switch_spst') {
        const n1 = pinNode(comp.id, 't1');
        const n2 = pinNode(comp.id, 't2');
        const isClosed = Boolean(comp.properties.switchClosed);
        const r = isClosed ? 0.01 : 1e9;
        addConductance(n1, n2, 1 / r);
      } else if (comp.type === 'push_button') {
        const n1 = pinNode(comp.id, 't1');
        const n2 = pinNode(comp.id, 't2');
        const isPressed = Boolean(comp.properties.buttonPressed);
        const r = isPressed ? 0.01 : 1e9;
        addConductance(n1, n2, 1 / r);
      } else if (comp.type === 'potentiometer') {
        const n1 = pinNode(comp.id, 'p1');
        const nw = pinNode(comp.id, 'wiper');
        const n2 = pinNode(comp.id, 'p2');
        let totalR = comp.properties.resistance ?? 10000;
        if (comp.properties.resistanceUnit === 'kΩ') totalR *= 1000;
        const ratio = Math.max(0.01, Math.min(0.99, comp.properties.potentiometerRatio ?? 0.5));
        const r1 = Math.max(0.1, totalR * ratio);
        const r2 = Math.max(0.1, totalR * (1 - ratio));
        addConductance(n1, nw, 1 / r1);
        addConductance(nw, n2, 1 / r2);
      } else if (comp.type === 'capacitor') {
        // Dynamic companion model for capacitor transient step:
        // C parallel with equivalent resistance Req = dt / (2*C)
        const n1 = pinNode(comp.id, 'pos');
        const n2 = pinNode(comp.id, 'neg');
        let c = comp.properties.capacitance ?? 100;
        if (comp.properties.capacitanceUnit === 'µF') c *= 1e-6;
        else if (comp.properties.capacitanceUnit === 'nF') c *= 1e-9;
        else if (comp.properties.capacitanceUnit === 'pF') c *= 1e-12;
        // In DC steady state or slow step, model as very high resistance
        const rCap = 1e8;
        addConductance(n1, n2, 1 / rCap);
      } else if (comp.type === 'led' || comp.type === 'diode') {
        const nAnode = pinNode(comp.id, 'anode');
        const nCathode = pinNode(comp.id, 'cathode');
        const lin = diodeLinearStates.get(comp.id)!;
        addConductance(nAnode, nCathode, lin.g);
        addCurrentSource(nAnode, nCathode, lin.Ieq);
      } else if (comp.type === 'transistor_npn') {
        const nB = pinNode(comp.id, 'base');
        const nC = pinNode(comp.id, 'collector');
        const nE = pinNode(comp.id, 'emitter');
        // Base-Emitter forward diode:
        addConductance(nB, nE, 1e-4);
        // Collector-Emitter channel:
        addConductance(nC, nE, 1e-7);
      }
    }

    // Stamp voltage sources into MNA
    for (let s = 0; s < numSources; s++) {
      const src = vSources[s];
      const eqIdx = nonGroundNodes + s;

      if (eqIdx >= 0 && eqIdx < matrixSize && A[eqIdx]) {
        if (src.posNode !== 0) {
          const posIdx = src.posNode - 1;
          if (posIdx >= 0 && posIdx < matrixSize && A[posIdx]) {
            A[posIdx][eqIdx] += 1;
            A[eqIdx][posIdx] += 1;
          }
        }
        if (src.negNode !== 0) {
          const negIdx = src.negNode - 1;
          if (negIdx >= 0 && negIdx < matrixSize && A[negIdx]) {
            A[negIdx][eqIdx] -= 1;
            A[eqIdx][negIdx] -= 1;
          }
        }
        z[eqIdx] = src.voltage;
      }
    }

    // Solve system
    const sol = solveLinearSystem(A, z);
    if (!sol) {
      break;
    }

    finalSolution = sol;

    // Helper to extract node voltage from solution
    const getV = (nodeIdx: number): number => {
      if (nodeIdx === 0 || !sol) return 0;
      const idx = nodeIdx - 1;
      return (idx >= 0 && idx < sol.length) ? sol[idx] : 0;
    };

    // Update non-linear elements (Diodes & LEDs) for next iteration
    for (const comp of components) {
      if (comp.type === 'led' || comp.type === 'diode') {
        const nAnode = pinNode(comp.id, 'anode');
        const nCathode = pinNode(comp.id, 'cathode');
        const vDrop = getV(nAnode) - getV(nCathode);

        let Vf = comp.properties.forwardVoltage ?? (comp.type === 'led' ? 2.0 : 0.7);
        if (comp.type === 'led') {
          if (comp.properties.ledColor === 'blue' || comp.properties.ledColor === 'white') Vf = 3.1;
          else if (comp.properties.ledColor === 'green') Vf = 2.2;
          else if (comp.properties.ledColor === 'amber') Vf = 2.1;
          else Vf = 1.9; // Red default
        }

        const Rf = comp.type === 'led' ? 15 : 0.8; // Internal dynamic resistance

        if (vDrop > Vf) {
          // Forward conduction region: I = (V - Vf) / Rf
          // Companion model: I = g * V + Ieq where g = 1/Rf, Ieq = -Vf/Rf
          const g = 1 / Rf;
          const Ieq = -Vf / Rf;
          diodeLinearStates.set(comp.id, { g, Ieq });
        } else if (vDrop > 0) {
          // Sub-threshold exponential curvature approximation
          const g = Math.max(1e-6, (1 / Rf) * Math.exp((vDrop - Vf) * 4));
          diodeLinearStates.set(comp.id, { g, Ieq: 0 });
        } else {
          // Reverse biased: leakage only
          diodeLinearStates.set(comp.id, { g: 1e-9, Ieq: 0 });
        }
      }
    }
  }

  // If no solvable solution, flag diagnostics
  if (!finalSolution) {
    diagnostics.status = 'error';
    diagnostics.isSolvable = false;
    diagnostics.errors.push('Circuit could not be resolved mathematically. Check for contradictory voltage sources or invalid connections.');
    return {
      isRunning: false,
      stepCount,
      results,
      wireCurrents,
      diagnostics,
    };
  }

  // Node voltage accessor function
  const getNodeVoltage = (nodeIdx: number): number => {
    if (nodeIdx === 0 || !finalSolution) return 0;
    const idx = nodeIdx - 1;
    return (idx >= 0 && idx < finalSolution.length) ? finalSolution[idx] : 0;
  };

  let totalSystemPower = 0;

  // Compute final per-component measurements
  for (const comp of components) {
    const pinVoltages: Record<string, number> = {};
    for (const pin of comp.pins) {
      const n = pinNode(comp.id, pin.id);
      pinVoltages[pin.id] = Number(getNodeVoltage(n).toFixed(3));
    }

    let voltageDrop = 0;
    let current = 0;
    let power = 0;
    let status: ComponentSimulationResult['status'] = 'normal';
    let statusMessage = '';
    let brightness = 0;

    if (comp.type === 'battery_9v' || comp.type === 'dc_source') {
      const vPos = pinVoltages['pos'] ?? 0;
      const vNeg = pinVoltages['neg'] ?? 0;
      voltageDrop = vPos - vNeg;

      // Find branch current index for this source
      const srcIndex = vSources.findIndex(s => s.comp.id === comp.id);
      if (srcIndex !== -1) {
        current = finalSolution[nonGroundNodes + srcIndex];
      }
      power = Math.abs(voltageDrop * current);
      totalSystemPower += power;

      if (Math.abs(current) > 4.5) {
        status = 'short_circuit';
        statusMessage = 'DANGER: Short circuit! Excessive current draw.';
        diagnostics.shortCircuits.push(`High current (${Math.abs(current).toFixed(1)}A) detected on ${comp.designator}.`);
      } else {
        status = 'active';
        statusMessage = `Supplying ${voltageDrop.toFixed(2)}V at ${(current * 1000).toFixed(1)}mA`;
      }
    } else if (comp.type === 'resistor') {
      const v1 = pinVoltages['p1'] ?? 0;
      const v2 = pinVoltages['p2'] ?? 0;
      voltageDrop = v1 - v2;

      let r = comp.properties.resistance ?? 220;
      if (comp.properties.resistanceUnit === 'kΩ') r *= 1000;
      else if (comp.properties.resistanceUnit === 'MΩ') r *= 1000000;
      r = Math.max(0.01, r);

      current = voltageDrop / r;
      power = Math.abs(voltageDrop * current);
      totalSystemPower += power;

      const pRating = comp.properties.powerRating ?? 0.25;
      if (power > pRating * 1.5) {
        status = 'overcurrent';
        statusMessage = `Warning: Power dissipation (${(power * 1000).toFixed(0)}mW) exceeds rating (${pRating * 1000}mW).`;
        diagnostics.warnings.push(`${comp.designator} is overheating (${(power * 1000).toFixed(0)}mW).`);
      } else if (Math.abs(current) > 1e-4) {
        status = 'active';
        statusMessage = `Conduction: ${(Math.abs(current) * 1000).toFixed(1)}mA`;
      } else {
        status = 'normal';
      }
    } else if (comp.type === 'led') {
      const vA = pinVoltages['anode'] ?? 0;
      const vK = pinVoltages['cathode'] ?? 0;
      voltageDrop = vA - vK;

      let Vf = comp.properties.forwardVoltage ?? 2.0;
      if (comp.properties.ledColor === 'blue' || comp.properties.ledColor === 'white') Vf = 3.1;
      else if (comp.properties.ledColor === 'green') Vf = 2.2;
      else if (comp.properties.ledColor === 'amber') Vf = 2.1;
      else Vf = 1.9;

      const Rf = 15;
      if (voltageDrop > Vf) {
        current = (voltageDrop - Vf) / Rf;
      } else {
        current = 0;
      }
      power = Math.max(0, voltageDrop * current);

      const maxCurrent = comp.properties.maxCurrent ?? 0.03; // 30mA
      if (current > maxCurrent * 1.3) {
        status = 'overcurrent';
        statusMessage = `BLOWN: ${(current * 1000).toFixed(1)}mA exceeds maximum rating (${(maxCurrent * 1000).toFixed(0)}mA). Add a resistor!`;
        diagnostics.warnings.push(`LED ${comp.designator} received excessive current and would blow! Use a current limiting resistor.`);
        brightness = 1.0;
      } else if (current > 0.0005) {
        // Forward conducting
        status = 'active';
        // Normal brightness curve
        brightness = Math.min(1.0, current / 0.02);
        statusMessage = `Lit: ${(current * 1000).toFixed(1)}mA (Forward V: ${voltageDrop.toFixed(2)}V)`;
      } else if (voltageDrop < -0.2) {
        status = 'reverse_biased';
        statusMessage = 'Reverse biased (Cathode higher than Anode). No light emitted.';
      } else {
        status = 'off';
        statusMessage = 'Off (Insufficient forward voltage).';
      }
    } else if (comp.type === 'diode') {
      const vA = pinVoltages['anode'] ?? 0;
      const vK = pinVoltages['cathode'] ?? 0;
      voltageDrop = vA - vK;
      const Vf = comp.properties.forwardVoltage ?? 0.7;
      if (voltageDrop > Vf) {
        current = (voltageDrop - Vf) / 0.8;
        status = 'active';
        statusMessage = `Conducting: ${(current * 1000).toFixed(0)}mA`;
      } else if (voltageDrop < -0.1) {
        current = 0;
        status = 'reverse_biased';
        statusMessage = 'Reverse blocking.';
      } else {
        current = 0;
        status = 'off';
      }
      power = Math.max(0, voltageDrop * current);
    } else if (comp.type === 'switch_spst') {
      const v1 = pinVoltages['t1'] ?? 0;
      const v2 = pinVoltages['t2'] ?? 0;
      voltageDrop = v1 - v2;
      const isClosed = Boolean(comp.properties.switchClosed);
      current = isClosed ? voltageDrop / 0.01 : 0;
      status = isClosed ? 'active' : 'off';
      statusMessage = isClosed ? 'Switch CLOSED (Conducting)' : 'Switch OPEN (Disconnected)';
    } else if (comp.type === 'push_button') {
      const v1 = pinVoltages['t1'] ?? 0;
      const v2 = pinVoltages['t2'] ?? 0;
      voltageDrop = v1 - v2;
      const isPressed = Boolean(comp.properties.buttonPressed);
      current = isPressed ? voltageDrop / 0.01 : 0;
      status = isPressed ? 'active' : 'off';
      statusMessage = isPressed ? 'Button PRESSED' : 'Button RELEASED';
    } else if (comp.type === 'ground') {
      voltageDrop = 0;
      current = 0;
      status = 'normal';
      statusMessage = '0.00V Reference Ground';
    } else if (comp.type === 'arduino_uno') {
      voltageDrop = 5.0;
      current = 0.02;
      status = 'active';
      statusMessage = 'Microcontroller active (5V / 3.3V power rails active)';
    } else {
      status = 'normal';
    }

    results[comp.id] = {
      componentId: comp.id,
      voltageDrop: Number(voltageDrop.toFixed(3)),
      current: Number(current.toFixed(5)),
      power: Number(power.toFixed(4)),
      status,
      statusMessage,
      brightness,
      pinVoltages,
    };
  }

  // Calculate current through each wire for visual animation
  for (const wire of wires) {
    // Current in wire can be inferred from the terminal it attaches to
    const fromCompRes = results[wire.fromComponentId];
    if (fromCompRes && Math.abs(fromCompRes.current) > 1e-6) {
      wireCurrents[wire.id] = fromCompRes.current;
    } else {
      const toCompRes = results[wire.toComponentId];
      wireCurrents[wire.id] = toCompRes ? toCompRes.current : 0;
    }
  }

  diagnostics.totalPower = Number(totalSystemPower.toFixed(3));
  diagnostics.branchCount = components.length + wires.length;

  return {
    isRunning: true,
    stepCount: stepCount + 1,
    results,
    wireCurrents,
    diagnostics,
  };
}
