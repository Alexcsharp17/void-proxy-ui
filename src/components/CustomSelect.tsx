import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2 relative">
      {label && <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{label}</label>}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-bg-input border border-border-main/20 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between hover:border-accent-primary/50 transition-all outline-none"
      >
        <span className={value ? 'text-text-primary' : 'text-text-muted'}>
          {value || placeholder || 'Select option'}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 bg-bg-panel border border-border-main rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto no-scrollbar p-1">
                {options.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                      value === option 
                        ? 'bg-accent-primary/10 text-accent-primary' 
                        : 'text-text-secondary hover:bg-bg-main hover:text-text-primary'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
