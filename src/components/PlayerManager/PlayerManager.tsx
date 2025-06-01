import React, { useState } from 'react';
import { type Player, PlayerRole } from '../../types';
import { useStrategyStore } from '../../store/useStrategyStore';
import { FaPlus, FaEdit, FaTrash, FaCrown, FaStar, FaUser } from 'react-icons/fa';

interface PlayerFormProps {
  player?: Player;
  onSubmit: (player: Omit<Player, 'id'>) => void;
  onCancel: () => void;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ player, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    nation: player?.nation || '',
    color: player?.color || '#D4AF37',
    role: player?.role || PlayerRole.MEMBER
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const predefinedColors = [
    '#D4AF37', // Gold
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#FFA07A', // Light Salmon
    '#98D8C8', // Mint
    '#F7DC6F', // Light Gold
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bebas text-cod-accent mb-1">Player Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full"
          required
          placeholder="Enter player name"
        />
      </div>

      <div>
        <label className="block text-sm font-bebas text-cod-accent mb-1">Nation</label>
        <input
          type="text"
          value={formData.nation}
          onChange={(e) => setFormData({ ...formData, nation: e.target.value })}
          className="mt-1 block w-full"
          required
          placeholder="e.g., Germany, USA, Soviet Union"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bebas text-cod-accent mb-1">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as PlayerRole })}
            className="mt-1 block w-full"
          >
            <option value={PlayerRole.COMMANDER}>Commander</option>
            <option value={PlayerRole.OFFICER}>Officer</option>
            <option value={PlayerRole.MEMBER}>Member</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bebas text-cod-accent mb-1">Color</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {predefinedColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded border-2 ${
                  formData.color === color ? 'border-cod-accent' : 'border-gray-400'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border-2 border-cod-accent/50 rounded-md text-sm font-bebas text-cod-accent bg-transparent hover:bg-cod-accent/10 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border-2 border-transparent rounded-md text-sm font-bebas text-cod-primary bg-cod-accent hover:bg-cod-accent/90 transition-colors"
        >
          {player ? 'Update Player' : 'Add Player'}
        </button>
      </div>
    </form>
  );
};

const getRoleIcon = (role: PlayerRole) => {
  switch (role) {
    case PlayerRole.COMMANDER:
      return <FaCrown className="text-yellow-400" />;
    case PlayerRole.OFFICER:
      return <FaStar className="text-blue-400" />;
    case PlayerRole.MEMBER:
      return <FaUser className="text-gray-400" />;
    default:
      return <FaUser className="text-gray-400" />;
  }
};

export const PlayerManager: React.FC = () => {
  const { players, addPlayer, updatePlayer, removePlayer } = useStrategyStore();
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>(undefined);

  const handleAddPlayer = () => {
    setEditingPlayer(undefined);
    setShowForm(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleSubmit = (playerData: Omit<Player, 'id'>) => {
    if (editingPlayer) {
      updatePlayer(editingPlayer.id, playerData);
    } else {
      addPlayer(playerData);
    }
    setShowForm(false);
    setEditingPlayer(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlayer(undefined);
  };

  const handleRemovePlayer = (playerId: string) => {
    if (confirm('Are you sure you want to remove this player?')) {
      removePlayer(playerId);
    }
  };

  return (
    <div className="bg-cod-secondary/90 backdrop-blur-sm p-3 rounded-lg shadow-2xl border-2 border-cod-accent/20 w-56">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bebas text-cod-accent">Alliance</h2>
        <button
          onClick={handleAddPlayer}
          className="flex items-center gap-1 px-2 py-1 bg-cod-accent text-cod-primary rounded text-xs hover:bg-cod-accent/90 transition-colors font-bebas"
        >
          <FaPlus /> Add
        </button>
      </div>

      {showForm && (
        <div className="mb-3 p-3 bg-cod-primary/50 rounded border border-cod-accent/30">
          <PlayerForm
            player={editingPlayer}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
        {players.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            <FaUser className="mx-auto text-2xl mb-1 opacity-50" />
            <p className="font-bebas text-sm">No members</p>
            <p className="text-xs">Add players to coordinate</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-2 bg-cod-primary/30 rounded border border-cod-accent/20 hover:bg-cod-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white/50"
                  style={{ backgroundColor: player.color }}
                />
                <div className="flex items-center gap-2">
                  {getRoleIcon(player.role)}
                  <div>
                    <div className="font-bebas text-cod-accent">{player.name}</div>
                    <div className="text-xs text-gray-400">{player.nation}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bebas text-gray-400 capitalize">
                  {player.role.toLowerCase()}
                </span>
                <button
                  onClick={() => handleEditPlayer(player)}
                  className="p-1 text-cod-accent hover:text-cod-accent/70 transition-colors"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {players.length > 0 && (
        <div className="mt-4 pt-4 border-t border-cod-accent/30">
          <div className="text-xs text-gray-400 font-bebas">
            Alliance Summary: {players.length} members
          </div>
          <div className="flex gap-1 mt-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: player.color }}
                title={`${player.name} (${player.nation})`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};