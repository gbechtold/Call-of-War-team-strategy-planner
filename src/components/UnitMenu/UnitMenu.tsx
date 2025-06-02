import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { type Unit, UnitType } from '../../types';
import { getUnitsByType } from '../../data/units';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface DraggableUnitProps {
  unit: Unit;
  onUnitClick?: (unit: Unit) => void;
}

const DraggableUnit: React.FC<DraggableUnitProps> = ({ unit, onUnitClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unit-${unit.id}`,
    data: { type: 'unit', unit }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 9999 : 1,
  } : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging && onUnitClick) {
      onUnitClick(unit);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-2 bg-cod-secondary border-2 border-cod-accent/30 rounded hover:border-cod-accent hover:bg-cod-primary transition-all transform hover:scale-105 hover:shadow-lg select-none relative group"
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-move touch-none"
      >
        <div className="text-lg text-center mb-1">{unit.icon}</div>
        <div className="text-[10px] text-center text-cod-accent font-bebas leading-tight">{unit.name}</div>
        <div className="text-[8px] text-center text-gray-400">{unit.buildTime >= 60 ? `${(unit.buildTime / 60).toFixed(1).replace('.0', '')}h` : `${unit.buildTime}m`}</div>
      </div>
      <button
        onClick={handleClick}
        className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-cod-accent/20 rounded flex items-center justify-center cursor-pointer transition-opacity"
        title="Click to add to timeline"
      >
        <span className="text-cod-accent text-xs font-bebas">+</span>
      </button>
    </div>
  );
};

interface UnitSubcategory {
  title: string;
  units: Unit[];
}

interface UnitCategoryProps {
  type: UnitType;
  title: string;
  units?: Unit[];
  subcategories?: UnitSubcategory[];
  isOpen: boolean;
  onToggle: () => void;
  onUnitClick?: (unit: Unit) => void;
}

const UnitCategory: React.FC<UnitCategoryProps> = ({ title, units, subcategories, isOpen, onToggle, onUnitClick }) => {
  const [openSubcategories, setOpenSubcategories] = useState<Record<string, boolean>>({});

  const toggleSubcategory = (subcategoryTitle: string) => {
    setOpenSubcategories(prev => ({ ...prev, [subcategoryTitle]: !prev[subcategoryTitle] }));
  };

  return (
    <div className="mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 bg-cod-primary hover:bg-cod-primary/80 rounded transition-colors"
      >
        <span className="font-bebas text-sm text-cod-accent">{title}</span>
        {isOpen ? <FaChevronDown className="text-cod-accent text-xs" /> : <FaChevronRight className="text-cod-accent text-xs" />}
      </button>
      
      {isOpen && (
        <div className="mt-2 animate-fadeIn">
          {/* Regular units (no subcategories) */}
          {units && (
            <div className="grid grid-cols-2 gap-2">
              {units.map((unit) => (
                <DraggableUnit key={unit.id} unit={unit} onUnitClick={onUnitClick} />
              ))}
            </div>
          )}
          
          {/* Subcategories */}
          {subcategories && subcategories.map((subcategory) => (
            <div key={subcategory.title} className="mb-2">
              <button
                onClick={() => toggleSubcategory(subcategory.title)}
                className="w-full flex items-center justify-between p-2 bg-cod-primary/60 hover:bg-cod-primary/80 rounded transition-colors ml-2"
              >
                <span className="font-bebas text-xs text-cod-accent/80">{subcategory.title}</span>
                {openSubcategories[subcategory.title] ? 
                  <FaChevronDown className="text-cod-accent/80 text-xs" /> : 
                  <FaChevronRight className="text-cod-accent/80 text-xs" />
                }
              </button>
              
              {openSubcategories[subcategory.title] && (
                <div className="grid grid-cols-2 gap-2 mt-2 ml-2 animate-fadeIn">
                  {subcategory.units.map((unit) => (
                    <DraggableUnit key={unit.id} unit={unit} onUnitClick={onUnitClick} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface UnitMenuProps {
  onUnitClick?: (unit: Unit) => void;
}

export const UnitMenu: React.FC<UnitMenuProps> = ({ onUnitClick }) => {
  const [openCategories, setOpenCategories] = useState<Record<UnitType, boolean>>({
    [UnitType.INFANTRY]: true,
    [UnitType.ARMOR]: false,
    [UnitType.ARTILLERY]: false,
    [UnitType.AIR_FORCE]: false,
    [UnitType.NAVY]: false,
    [UnitType.SUPPORT]: false,
  });

  const toggleCategory = (type: UnitType) => {
    setOpenCategories(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Organize Navy units into subcategories
  const navyUnits = getUnitsByType(UnitType.NAVY);
  const navySubcategories = [
    {
      title: 'Submarines',
      units: navyUnits.filter(unit => unit.id === 'submarine')
    },
    {
      title: 'Surface Ships',
      units: navyUnits.filter(unit => ['destroyer', 'cruiser', 'battleship'].includes(unit.id))
    }
  ];

  const categories = [
    { type: UnitType.INFANTRY, title: 'Infantry', units: getUnitsByType(UnitType.INFANTRY) },
    { type: UnitType.ARMOR, title: 'Armor', units: getUnitsByType(UnitType.ARMOR) },
    { type: UnitType.ARTILLERY, title: 'Artillery', units: getUnitsByType(UnitType.ARTILLERY) },
    { type: UnitType.AIR_FORCE, title: 'Air Force', units: getUnitsByType(UnitType.AIR_FORCE) },
    { type: UnitType.NAVY, title: 'Navy', subcategories: navySubcategories },
  ];

  return (
    <div className="w-56 bg-cod-secondary/90 backdrop-blur-sm p-3 rounded-lg shadow-2xl border-2 border-cod-accent/20">
      <h2 className="text-lg font-bebas text-cod-accent mb-2 text-center">Unit Production</h2>
      <div className="text-xs text-gray-400 mb-3 text-center">Drag to timeline or click to add</div>
      
      <div className="max-h-[500px] overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
        {categories.map(({ type, title, units, subcategories }) => (
          <UnitCategory
            key={type}
            type={type}
            title={title}
            units={units}
            subcategories={subcategories}
            isOpen={openCategories[type]}
            onToggle={() => toggleCategory(type)}
            onUnitClick={onUnitClick}
          />
        ))}
      </div>
    </div>
  );
};