import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { type Unit, UnitType } from '../../types';
import { getUnitsByType } from '../../data/units';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface DraggableUnitProps {
  unit: Unit;
}

const DraggableUnit: React.FC<DraggableUnitProps> = ({ unit }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unit-${unit.id}`,
    data: { type: 'unit', unit }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 bg-cod-secondary border-2 border-cod-accent/30 rounded-lg cursor-move hover:border-cod-accent hover:bg-cod-primary transition-all transform hover:scale-105 hover:shadow-lg"
    >
      <div className="text-2xl text-center mb-1">{unit.icon}</div>
      <div className="text-xs text-center text-cod-accent font-bebas">{unit.name}</div>
      <div className="text-xs text-center text-gray-400">{unit.buildTime}h</div>
    </div>
  );
};

interface UnitCategoryProps {
  type: UnitType;
  title: string;
  units: Unit[];
  isOpen: boolean;
  onToggle: () => void;
}

const UnitCategory: React.FC<UnitCategoryProps> = ({ title, units, isOpen, onToggle }) => {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-cod-primary hover:bg-cod-primary/80 rounded-lg transition-colors"
      >
        <span className="font-bebas text-lg text-cod-accent">{title}</span>
        {isOpen ? <FaChevronDown className="text-cod-accent" /> : <FaChevronRight className="text-cod-accent" />}
      </button>
      
      {isOpen && (
        <div className="grid grid-cols-2 gap-2 mt-2 animate-fadeIn">
          {units.map((unit) => (
            <DraggableUnit key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
};

export const UnitMenu: React.FC = () => {
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

  const categories = [
    { type: UnitType.INFANTRY, title: 'Infantry Units', units: getUnitsByType(UnitType.INFANTRY) },
    { type: UnitType.ARMOR, title: 'Armored Units', units: getUnitsByType(UnitType.ARMOR) },
    { type: UnitType.ARTILLERY, title: 'Artillery Units', units: getUnitsByType(UnitType.ARTILLERY) },
    { type: UnitType.AIR_FORCE, title: 'Air Force', units: getUnitsByType(UnitType.AIR_FORCE) },
    { type: UnitType.NAVY, title: 'Naval Units', units: getUnitsByType(UnitType.NAVY) },
  ];

  return (
    <div className="w-64 bg-cod-secondary/90 backdrop-blur-sm p-4 rounded-lg shadow-2xl border-2 border-cod-accent/20">
      <h2 className="text-2xl font-bebas text-cod-accent mb-4 text-center">Unit Production</h2>
      <div className="text-xs text-gray-400 mb-4 text-center">Drag units to timeline</div>
      
      <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {categories.map(({ type, title, units }) => (
          <UnitCategory
            key={type}
            type={type}
            title={title}
            units={units}
            isOpen={openCategories[type]}
            onToggle={() => toggleCategory(type)}
          />
        ))}
      </div>
    </div>
  );
};