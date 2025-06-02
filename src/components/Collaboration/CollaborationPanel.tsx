import React, { useState } from 'react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { ConflictNotifications, ConflictDashboard } from '../ConflictResolution';
import { FaUsers, FaCopy, FaSignOutAlt, FaUserPlus, FaExclamationTriangle, FaSpinner, FaCheck, FaClock, FaChartBar } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

export const CollaborationPanel: React.FC = () => {
  const {
    isConnected,
    roomCode,
    isHost,
    connectedPeers,
    username,
    isJoining,
    connectionError,
    lastSyncTime,
    createRoom,
    joinRoom,
    leaveRoom,
    setUsername,
    clearError,
    getRoomLink,
    conflictResolution,
    recentUpdates,
  } = useCollaboration();

  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [localUsername, setLocalUsername] = useState(username);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showConflictDashboard, setShowConflictDashboard] = useState(false);

  const handleCreateRoom = async () => {
    const roomCode = await createRoom(localUsername);
    if (roomCode) {
      setUsername(localUsername);
    }
  };

  const handleJoinRoom = async () => {
    if (joinRoomCode.trim().length === 6) {
      const success = await joinRoom(joinRoomCode.trim().toUpperCase(), localUsername);
      if (success) {
        setUsername(localUsername);
        setShowJoinForm(false);
        setJoinRoomCode('');
      }
    }
  };

  const handleCopyLink = async () => {
    const link = getRoomLink();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    setShowJoinForm(false);
    setJoinRoomCode('');
  };

  const getConnectionStatusIcon = () => {
    if (isJoining) return <FaSpinner className="animate-spin text-yellow-400" />;
    if (isConnected) return <FaCheck className="text-green-400" />;
    if (connectionError) return <FaExclamationTriangle className="text-red-400" />;
    return <FaClock className="text-gray-400" />;
  };

  const getConnectionStatusText = () => {
    if (isJoining) return 'Connecting...';
    if (isConnected) return `Connected • ${connectedPeers} peer${connectedPeers !== 1 ? 's' : ''}`;
    if (connectionError) return 'Connection failed';
    return 'Not connected';
  };

  return (
    <div className="bg-cod-secondary/90 backdrop-blur-sm p-3 rounded-lg shadow-2xl border-2 border-cod-accent/20 w-56">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bebas text-cod-accent flex items-center gap-2">
          <FaUsers /> Collaborate
        </h2>
        {getConnectionStatusIcon()}
      </div>

      {/* Connection Status */}
      <div className={`mb-3 p-2 bg-cod-primary/30 rounded border border-cod-accent/20 ${
        recentUpdates.size > 0 ? 'animate-pulse-update' : ''
      }`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-300">{getConnectionStatusText()}</span>
            {recentUpdates.size > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cod-accent rounded-full animate-pulse"></div>
                <span className="text-cod-accent text-[10px]">syncing</span>
              </div>
            )}
          </div>
          {roomCode && (
            <span className="text-cod-accent font-mono font-bold">{roomCode}</span>
          )}
        </div>
        {lastSyncTime && (
          <div className="text-[10px] text-gray-500 mt-1">
            Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
          </div>
        )}
        {connectionError && (
          <div className="text-[10px] text-red-400 mt-1">
            {connectionError}
            <button
              onClick={clearError}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Username Setting */}
      <div className="mb-3">
        <label className="text-xs text-gray-400 block mb-1">Your name:</label>
        <input
          type="text"
          value={localUsername}
          onChange={(e) => setLocalUsername(e.target.value)}
          disabled={isConnected}
          className="w-full p-2 bg-cod-secondary border border-cod-accent/30 rounded text-xs text-gray-300 disabled:opacity-50"
          placeholder="Enter your name"
          maxLength={20}
        />
      </div>

      {!isConnected ? (
        <div className="space-y-2">
          {/* Create Room */}
          <button
            onClick={handleCreateRoom}
            disabled={isJoining || !localUsername.trim()}
            className="w-full px-3 py-2 bg-cod-accent text-cod-primary rounded text-sm font-bebas hover:bg-cod-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Creating...' : 'Create Room'}
          </button>

          {/* Join Room Toggle */}
          <button
            onClick={() => setShowJoinForm(!showJoinForm)}
            disabled={isJoining}
            className="w-full px-3 py-2 bg-cod-secondary border border-cod-accent text-cod-accent rounded text-sm font-bebas hover:bg-cod-accent hover:text-cod-primary transition-colors disabled:opacity-50"
          >
            <FaUserPlus className="inline mr-2" />
            Join Room
          </button>

          {/* Join Room Form */}
          {showJoinForm && (
            <div className="p-3 bg-cod-primary/30 rounded border border-cod-accent/20">
              <label className="text-xs text-gray-400 block mb-1">Room code:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="flex-1 p-2 bg-cod-secondary border border-cod-accent/30 rounded text-xs text-gray-300 font-mono"
                />
                <button
                  onClick={handleJoinRoom}
                  disabled={joinRoomCode.length !== 6 || isJoining || !localUsername.trim()}
                  className="px-3 py-2 bg-cod-accent text-cod-primary rounded text-xs font-bebas hover:bg-cod-accent/90 transition-colors disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Room Info */}
          <div className="p-3 bg-cod-primary/30 rounded border border-cod-accent/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">
                {isHost ? 'Hosting room' : 'Joined room'}
              </span>
              <span className="text-cod-accent font-mono font-bold text-lg">
                {roomCode}
              </span>
            </div>
            
            {isHost && (
              <button
                onClick={handleCopyLink}
                className="w-full px-3 py-2 bg-cod-secondary border border-cod-accent text-cod-accent rounded text-sm font-bebas hover:bg-cod-accent hover:text-cod-primary transition-colors flex items-center justify-center gap-2"
              >
                {linkCopied ? (
                  <>
                    <FaCheck /> Copied!
                  </>
                ) : (
                  <>
                    <FaCopy /> Copy Link
                  </>
                )}
              </button>
            )}
          </div>

          {/* Connected Users */}
          <div className="p-3 bg-cod-primary/30 rounded border border-cod-accent/20">
            <div className="text-sm text-gray-300 mb-2">Connected users:</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">{username} (you)</span>
                {isHost && <span className="text-cod-accent text-[10px]">HOST</span>}
              </div>
              {Array.from({ length: connectedPeers }, (_, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">User {i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conflict Resolution Dashboard Toggle */}
          <button
            onClick={() => setShowConflictDashboard(!showConflictDashboard)}
            className="w-full px-3 py-2 bg-cod-secondary border border-cod-accent text-cod-accent rounded text-sm font-bebas hover:bg-cod-accent hover:text-cod-primary transition-colors flex items-center justify-center gap-2"
          >
            <FaChartBar /> {showConflictDashboard ? 'Hide' : 'Show'} Conflict Stats
          </button>

          {/* Leave Room */}
          <button
            onClick={handleLeaveRoom}
            className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm font-bebas hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <FaSignOutAlt /> Leave Room
          </button>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-cod-accent/20">
        <p className="text-xs text-gray-500">
          Real-time collaboration allows multiple users to edit the same strategy simultaneously.
        </p>
      </div>

      {/* Conflict Resolution Components */}
      <>
        <ConflictNotifications
          notifications={conflictResolution.notifications}
          onDismiss={conflictResolution.dismissNotification}
        />
        
        {showConflictDashboard && isConnected && (
          <div className="fixed top-20 left-4 z-40">
            <ConflictDashboard
              stats={conflictResolution.getConflictStats()}
              lastResolution={conflictResolution.lastResolution}
              isProcessing={conflictResolution.isProcessing}
            />
          </div>
        )}
      </>
    </div>
  );
};