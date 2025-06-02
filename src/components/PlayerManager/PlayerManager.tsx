import React, { useState } from 'react';
import { type Player, PlayerRole } from '../../types';
import { useRealtimeStore } from '../../hooks/useRealtimeStore';
import { FaPlus, FaTrash, FaUser } from 'react-icons/fa';
import { getCountryFlag } from '../../utils/countryFlags';

const getRoleIcon = (role: PlayerRole): string => {
  switch (role) {
    case PlayerRole.COMMANDER: return '⭐';
    case PlayerRole.OFFICER: return '🎖️';
    case PlayerRole.MEMBER: return '🪖';
    default: return '🪖';
  }
};

const getRoleTitle = (role: PlayerRole): string => {
  switch (role) {
    case PlayerRole.COMMANDER: return 'Commander';
    case PlayerRole.OFFICER: return 'Officer';
    case PlayerRole.MEMBER: return 'Member';
    default: return 'Member';
  }
};

interface PlayerFormProps {
  player?: Player;
  onSubmit: (player: Omit<Player, 'id'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ player, onSubmit, onDelete }) => {
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
    '#D4AF37', // Military Gold (more muted than bright gold)
    '#B22222', // Fire Brick Red (military red)
    '#4682B4', // Steel Blue (naval blue)
    '#556B2F', // Dark Olive Green (army green)
    '#8B4513', // Saddle Brown (earth tone)
    '#4B0082', // Indigo (royal purple)
    '#DC143C', // Crimson (battle red)
    '#2F4F4F', // Dark Slate Gray (tactical gray)
    '#8FBC8F', // Dark Sea Green (field green)
    '#CD853F', // Peru (desert tan)
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

      <div className="flex justify-between pt-4">
        {player && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-2 border-2 border-red-500/50 rounded-md text-sm font-bebas text-red-500 bg-transparent hover:bg-red-500/10 transition-colors flex items-center gap-1"
          >
            <FaTrash className="text-xs" /> Delete
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 border-2 border-transparent rounded-md text-sm font-bebas text-cod-primary bg-cod-accent hover:bg-cod-accent/90 transition-colors ml-auto"
        >
          {player ? 'Update' : 'Add Player'}
        </button>
      </div>
    </form>
  );
};


export const PlayerManager: React.FC = () => {
  const { players, addPlayer, updatePlayer, removePlayer } = useRealtimeStore();
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
            onDelete={editingPlayer ? () => {
              handleRemovePlayer(editingPlayer.id);
              handleCancel();
            } : undefined}
          />
        </div>
      )}

      <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
        {players.length === 0 ? (
          <div className="text-left text-gray-400 py-4">
            <FaUser className="mx-auto text-2xl mb-1 opacity-50" />
            <p className="font-bebas text-sm">No members</p>
            <p className="text-xs">Add players to coordinate</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              onClick={() => handleEditPlayer(player)}
              className="flex items-center justify-between p-2 bg-cod-primary/30 rounded border border-cod-accent/20 hover:bg-cod-primary/50 transition-colors cursor-pointer"
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
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="text-base">{getCountryFlag(player.nation)}</span>
                      {player.nation}
                    </div>
                  </div>
                </div>
              </div>
              
              <span className="text-sm" title={getRoleTitle(player.role)}>
                {getRoleIcon(player.role)}
              </span>
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