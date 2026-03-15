import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
      active 
        ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20' 
        : 'text-text-secondary hover:bg-bg-panel hover:text-text-primary'
    }`}
  >
    <Icon className={`w-5 h-5 transition-colors ${active ? 'text-accent-primary' : 'group-hover:text-accent-primary'}`} />
    <span className="text-sm font-semibold tracking-tight">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-primary shadow-[0_0_10px_var(--accent-primary)]" />}
  </button>
);

export default SidebarItem;
