import React, { useEffect, useState } from 'react';
// import { Play, Plus, ListPlus, Info } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  show: boolean;
  onClose: () => void;
  options: {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    submenu?: Array<{
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }>;
  }[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, show, onClose, options }) => {
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  
  // Close the menu when clicking outside
  useEffect(() => {
    if (!show) return;
    
    const handleClickOutside = () => {
      onClose();
    };
    
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [show, onClose]);
  
  if (!show) return null;
  
  // Adjust position to prevent menu from going off-screen
  const menuStyle = {
    left: Math.min(x, window.innerWidth - 200), // Assuming menu width is 200px
    top: Math.min(y, window.innerHeight - options.length * 40), // Estimate height based on items
  };
  
  return (
    <div 
      className="fixed z-50" 
      style={menuStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        <div className="py-1">
          {options.map((option, index) => {
            if (option.label === 'separator') {
              return <hr key={`sep-${index}`} className="my-1 border-gray-700" />;
            }
            
            const hasSubmenu = option.submenu && option.submenu.length > 0;
            const isSubmenuActive = activeSubmenu === index;
            
            return (
              <div key={`opt-${index}`} className="relative">
                <button
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center justify-between ${
                    option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onClick={() => {
                    if (option.disabled) return;
                    if (hasSubmenu) {
                      setActiveSubmenu(isSubmenuActive ? null : index);
                    } else {
                      option.onClick();
                      onClose();
                    }
                  }}
                  onMouseEnter={() => {
                    if (hasSubmenu) setActiveSubmenu(index);
                  }}
                >
                  <span className="flex items-center">
                    {option.icon && <span className="mr-2">{option.icon}</span>}
                    {option.label}
                  </span>
                  {hasSubmenu && (
                    <span className="ml-2">▶</span>
                  )}
                </button>
                
                {/* Submenu */}
                {hasSubmenu && isSubmenuActive && (
                  <div 
                    className="absolute left-full top-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[180px]"
                    style={{ marginLeft: '1px' }}
                  >
                    <div className="py-1">
                      {option.submenu!.map((subOption, subIndex) => (
                        <button
                          key={`sub-${index}-${subIndex}`}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${
                            subOption.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            if (subOption.disabled) return;
                            subOption.onClick();
                            onClose();
                          }}
                        >
                          {subOption.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContextMenu;