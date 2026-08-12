import React, { useState } from 'react';
import { X, Building2, Image, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { FounderBrandingConfig } from '../../types';
import { Button } from './Button';
import { useTheme } from '../../context/ThemeContext';

interface FounderBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: FounderBrandingConfig;
  onSaveBranding: (updated: FounderBrandingConfig) => void;
}

export const FounderBrandingModal: React.FC<FounderBrandingModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [formData, setFormData] = useState<FounderBrandingConfig>(branding);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding(formData);
    setCopiedSuccess(true);
    setTimeout(() => {
      setCopiedSuccess(false);
      onClose();
    }, 600);
  };

  const presetLogos = [
    { label: 'Default System', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80' },
    { label: 'Precision Optics', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=120&h=120&q=80' },
    { label: 'Cleanroom Lab', url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=120&h=120&q=80' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-[#111315] border-[#2B323A] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-[#8B9DFF]/15 text-[#8B9DFF] border-[#8B9DFF]/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Founder Customization & Report Branding</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Configure global company identities, logos, header/footer styling, and signature defaults.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-[#2B323A] text-slate-400' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Company Identity & Header */}
          <div className="space-y-4">
            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-[#8ECDF7]' : 'text-indigo-700'}`}>
              1. Company Identity & Header Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border transition-colors ${
                    isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-100 focus:border-[#8B9DFF]' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Report Header Banner Text</label>
                <input
                  type="text"
                  value={formData.headerText}
                  onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border transition-colors ${
                    isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-100 focus:border-[#8B9DFF]' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Company Logo Selector */}
            <div>
              <label className="block font-semibold mb-1.5 flex items-center justify-between">
                <span>Company Logo Asset URL</span>
                <span className="text-[10px] text-slate-400 font-normal">Select preset or insert image link</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.companyLogoUrl}
                  onChange={(e) => setFormData({ ...formData, companyLogoUrl: e.target.value })}
                  placeholder="https://..."
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs ${
                    isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">Presets:</span>
                {presetLogos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, companyLogoUrl: p.url })}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium transition-all ${
                      formData.companyLogoUrl === p.url
                        ? isDark ? 'bg-[#8B9DFF]/20 text-[#8B9DFF] border-[#8B9DFF]' : 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        : isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-[#2B323A]" />

          {/* Section 2: Footer & Legal Disclaimer */}
          <div className="space-y-4">
            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-[#8ECDF7]' : 'text-indigo-700'}`}>
              2. Footer Text & Confidentiality Banners
            </h4>

            <div>
              <label className="block font-semibold mb-1">Company Footer Disclaimer Text</label>
              <input
                type="text"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border transition-colors ${
                  isDark ? 'bg-[#1A1D21] border-[#2B323A] text-slate-100 focus:border-[#8B9DFF]' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.confidentialityBanner}
                  onChange={(e) => setFormData({ ...formData, confidentialityBanner: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold block">Confidentiality Watermark</span>
                  <span className="text-[10px] text-slate-400">Display Highly Confidential banner on document pages</span>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.showPageNumbers}
                  onChange={(e) => setFormData({ ...formData, showPageNumbers: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold block">Page Numbering</span>
                  <span className="text-[10px] text-slate-400">Include "Page X of Y" in company footer</span>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-[#2B323A]" />

          {/* Section 3: Signature Blocks Defaults */}
          <div className="space-y-4">
            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-[#8ECDF7]' : 'text-indigo-700'}`}>
              3. Signature Blocks Defaults
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.engineerSignatureBlock}
                  onChange={(e) => setFormData({ ...formData, engineerSignatureBlock: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold block">Engineer Signature Block</span>
                  <span className="text-[10px] text-slate-400">Include digital SHA-256 verification stamp</span>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                isDark ? 'bg-[#1A1D21] border-[#2B323A]' : 'bg-slate-50 border-slate-200'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.customerSignatureBlock}
                  onChange={(e) => setFormData({ ...formData, customerSignatureBlock: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="font-semibold block">Customer Sign-off Block</span>
                  <span className="text-[10px] text-slate-400">Include cleanroom plant manager approval block</span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit / Cancel Buttons */}
          <div className={`pt-4 border-t flex items-center justify-between ${
            isDark ? 'border-[#2B323A]' : 'border-slate-200'
          }`}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              icon={copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Sparkles className="w-4 h-4" />}
            >
              {copiedSuccess ? 'Saved Customization!' : 'Save Founder Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
