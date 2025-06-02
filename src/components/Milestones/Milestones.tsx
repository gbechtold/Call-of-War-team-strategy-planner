import React, { useState } from 'react';
import { useCurrentStrategy } from '../../hooks/useCurrentStrategy';
import { FaFlag, FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';

interface Milestone {
  id: string;
  name: string;
  description: string;
  date: Date;
  color: string;
  strategyId: string;
}

export const Milestones: React.FC = () => {
  const { strategy } = useCurrentStrategy();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    color: '#FFD700'
  });

  const milestoneColors = [
    '#FFD700', // Gold
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#F39C12', // Orange
  ];

  const handleAddMilestone = () => {
    if (!strategy || !newMilestone.name.trim()) return;

    const milestone: Milestone = {
      id: `milestone-${Date.now()}`,
      name: newMilestone.name.trim(),
      description: newMilestone.description.trim(),
      date: new Date(newMilestone.date),
      color: newMilestone.color,
      strategyId: strategy.id
    };

    setMilestones(prev => [...prev, milestone]);
    setNewMilestone({
      name: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      color: '#FFD700'
    });
    setIsAddingMilestone(false);

    // Save to localStorage
    const storageKey = `milestones-${strategy.id}`;
    const updated = [...milestones, milestone];
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setNewMilestone({
      name: milestone.name,
      description: milestone.description,
      date: format(milestone.date, 'yyyy-MM-dd'),
      color: milestone.color
    });
    setIsAddingMilestone(true);
  };

  const handleUpdateMilestone = () => {
    if (!editingMilestone || !strategy) return;

    const updated = milestones.map(m => 
      m.id === editingMilestone.id 
        ? {
            ...m,
            name: newMilestone.name.trim(),
            description: newMilestone.description.trim(),
            date: new Date(newMilestone.date),
            color: newMilestone.color
          }
        : m
    );

    setMilestones(updated);
    setEditingMilestone(null);
    setIsAddingMilestone(false);
    setNewMilestone({
      name: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      color: '#FFD700'
    });

    // Save to localStorage
    const storageKey = `milestones-${strategy.id}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!strategy) return;
    
    const updated = milestones.filter(m => m.id !== milestoneId);
    setMilestones(updated);

    // Save to localStorage
    const storageKey = `milestones-${strategy.id}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleCancel = () => {
    setIsAddingMilestone(false);
    setEditingMilestone(null);
    setShowDeleteConfirm(false);
    setNewMilestone({
      name: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      color: '#FFD700'
    });
  };
  
  const confirmDeleteMilestone = () => {
    if (editingMilestone && strategy) {
      handleDeleteMilestone(editingMilestone.id);
      setShowDeleteConfirm(false);
      handleCancel();
    }
  };
  
  const cancelDeleteMilestone = () => {
    setShowDeleteConfirm(false);
  };

  // Load milestones from localStorage
  React.useEffect(() => {
    if (!strategy) return;
    
    const storageKey = `milestones-${strategy.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const withDates = parsed.map((m: any) => ({
          ...m,
          date: new Date(m.date)
        }));
        setMilestones(withDates);
      } catch (error) {
        console.error('Error loading milestones:', error);
      }
    }
  }, [strategy]);

  return (
    <div className="bg-cod-secondary/90 backdrop-blur-sm p-3 rounded-lg shadow-2xl border-2 border-cod-accent/20 w-64">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bebas text-cod-accent flex items-center gap-2">
          <FaFlag /> Milestones
        </h2>
        <button
          onClick={() => setIsAddingMilestone(true)}
          className="p-1 text-cod-accent hover:text-cod-accent/70 transition-colors"
          title="Add milestone"
        >
          <FaPlus className="text-sm" />
        </button>
      </div>

      {isAddingMilestone && (
        <div className="mb-3 p-3 bg-cod-primary/30 rounded border border-cod-accent/20">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Milestone name"
              value={newMilestone.name}
              onChange={(e) => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 bg-cod-primary/50 border border-cod-accent/20 rounded text-sm text-gray-300 placeholder-gray-500 focus:border-cod-accent/50 focus:outline-none"
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 bg-cod-primary/50 border border-cod-accent/20 rounded text-sm text-gray-300 placeholder-gray-500 resize-none h-16 focus:border-cod-accent/50 focus:outline-none"
            />
            <input
              type="date"
              value={newMilestone.date}
              onChange={(e) => setNewMilestone(prev => ({ ...prev, date: e.target.value }))}
              className="w-full p-2 bg-cod-primary/50 border border-cod-accent/20 rounded text-sm text-gray-300 focus:border-cod-accent/50 focus:outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              {milestoneColors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewMilestone(prev => ({ ...prev, color }))}
                  className={`w-6 h-6 rounded-full border-2 ${newMilestone.color === color ? 'border-white' : 'border-transparent'} transition-all`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {editingMilestone && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 border-2 border-red-500/50 rounded text-sm font-bebas text-red-500 bg-transparent hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              )}
              <button
                onClick={editingMilestone ? handleUpdateMilestone : handleAddMilestone}
                className="flex-1 px-3 py-2 bg-cod-accent text-cod-primary rounded text-sm font-bebas hover:bg-cod-accent/90 transition-colors"
              >
                {editingMilestone ? 'Save' : 'Add'}
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-2 bg-gray-600 text-white rounded text-sm font-bebas hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {milestones.length === 0 ? (
          <p className="text-gray-500 text-sm text-left py-4">
            No milestones defined yet
          </p>
        ) : (
          milestones
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(milestone => (
              <div
                key={milestone.id}
                className="p-2 bg-cod-primary/30 rounded border border-cod-accent/20 hover:border-cod-accent/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: milestone.color }}
                      />
                      <h3 className="text-sm font-bebas text-cod-accent">
                        {milestone.name}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(milestone.date, 'MMM d, yyyy')}
                    </p>
                    {milestone.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditMilestone(milestone)}
                      className="p-1 text-gray-400 hover:text-cod-accent transition-colors"
                      title="Edit milestone"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete milestone"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      <p className="text-xs text-gray-500 mt-3 text-left">
        Milestones appear as markers on timeline
      </p>
      
      {/* Delete Milestone Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black opacity-75" onClick={cancelDeleteMilestone}></div>
            
            <div className="relative bg-cod-primary border-2 border-cod-accent rounded-lg shadow-2xl max-w-md w-full animate-fadeIn">
              <div className="flex items-center justify-between p-4 border-b border-cod-accent/30">
                <h3 className="text-2xl font-bebas text-cod-accent">Delete Milestone</h3>
                <button
                  onClick={cancelDeleteMilestone}
                  className="text-cod-accent hover:text-cod-accent/70 focus:outline-none transition-colors"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 bg-cod-secondary/50">
                <p className="text-gray-300 mb-6">Do you really want to delete this Milestone?</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelDeleteMilestone}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-bebas"
                  >
                    No
                  </button>
                  <button
                    onClick={confirmDeleteMilestone}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-bebas"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};