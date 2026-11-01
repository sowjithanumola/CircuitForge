import React from 'react';
import { Shield, FileText, Check } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E131F] border border-[#232B3E] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232B3E] flex items-center justify-between bg-[#131720]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-500/10 text-[#00F0FF] border border-cyan-500/30">
              {type === 'privacy' ? <Shield className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                {type === 'privacy' ? 'Privacy Policy' : 'Terms and Conditions'}
              </h3>
              <p className="text-[11px] text-slate-400">Effective Date: November 1, 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1E293B]"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-300 leading-relaxed space-y-4 font-sans">
          {type === 'privacy' ? (
            <>
              <section>
                <h4 className="font-mono text-slate-100 font-bold mb-1">1. Local-First Data Privacy</h4>
                <p>
                  CircuitForge is an entirely local, in-browser electronics design and simulation studio.
                  All circuit diagrams, schematics, component parameters, and simulation calculations remain on your device.
                  Your designs are saved in your local browser storage and are never transmitted to external cloud servers.
                </p>
              </section>

              <section>
                <h4 className="font-mono text-slate-100 font-bold mb-1">2. No Tracking and No Telemetry</h4>
                <p>
                  We do not collect personal identifying information, browsing histories, keystrokes, or circuit configurations.
                  There are no third-party tracking scripts, analytics cookies, or behavioral advertising mechanisms installed in CircuitForge.
                </p>
              </section>

              <section>
                <h4 className="font-mono text-slate-100 font-bold mb-1">3. File Import and Export</h4>
                <p>
                  When you export or import JSON project files, PNG diagrams, or SVG schematics, all encoding and decoding operations
                  are executed strictly in client-side memory using the standard browser Web APIs.
                </p>
              </section>

              <section>
                <h4 className="font-mono text-slate-100 font-bold mb-1">4. Contact &amp; Updates</h4>
                <p>
                  For inquiries or technical questions regarding CircuitForge, please visit our open engineering portal.
                  Any future policy updates will be posted directly within the application interface.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h4 className="font-mono text-slate-100 font-bold mb-1">1. Acceptance of Terms</h4>
                <p>
                  By accessing or utilizing CircuitForge, you acknowledge and agree to these Terms and Conditions in their entirety.
                  If you disagree with any part of these terms, you should discontinue use of the application.
                </p>
              </section>

              <section>
                <h4 className="font-mono text-slate-100 font-bold mb-1">2. Educational and Prototyping Use</h4>
                <p>
                  CircuitForge provides mathematical simulations and visual modeling for educational, hobbyist, and preliminary design prototyping.
                  Calculations are based on simplified circuit models and nodal analysis approximations. The software does not replace
                  certified SPICE simulations, bench testing, physical testing with calibrated instruments, or safety compliance reviews.
                </p>
              </section>

              <section>
                <h4 className="font-mono text-slate-100 font-bold mb-1">3. Disclaimer of Liability</h4>
                <p>
                  The software is provided &quot;as is&quot; without warranty of any kind, either express or implied. Under no circumstances
                  shall the creators or maintainers of CircuitForge be held liable for any damages, hardware failure, component burnout,
                  or injuries resulting from physical circuit assembly inspired by simulation results.
                </p>
              </section>

              <section>
                <h4 className="font-mono text-slate-100 font-bold mb-1">4. Intellectual Property</h4>
                <p>
                  All circuits, schematics, netlists, and project files created by you remain your sole intellectual property.
                  You retain unrestricted rights to distribute, export, and manufacture your circuit designs.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#232B3E] bg-[#131720] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#00F0FF] hover:bg-cyan-400 text-[#090B10] font-bold text-xs rounded transition-colors flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>I Understand</span>
          </button>
        </div>
      </div>
    </div>
  );
};
