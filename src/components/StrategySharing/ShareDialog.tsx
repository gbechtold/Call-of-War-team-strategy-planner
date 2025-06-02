import React, { useState, useRef } from 'react';
import { useCurrentStrategy } from '../../hooks/useCurrentStrategy';
import { useStrategyStore } from '../../store/useStrategyStore';
import { FaShare, FaCopy, FaCheck, FaQrcode, FaEnvelope, FaDiscord, FaTelegram, FaWhatsapp, FaDownload, FaUpload, FaUsers, FaCrown, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import { encodeStrategy, decodeStrategy } from '../../utils/shareCode';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose }) => {
  const { strategy } = useCurrentStrategy();
  const { tasks, players, createStrategy, createTask, addPlayer } = useStrategyStore();
  const [activeTab, setActiveTab] = useState<'share' | 'collaborate' | 'export' | 'import'>('share');
  const [shareMethod, setShareMethod] = useState<'link' | 'code' | 'qr'>('link');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareCode, setShareCode] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [importCode, setImportCode] = useState('');
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateShareableContent = async () => {
    if (!strategy) return;
    
    const strategyTasks = tasks.filter(task => task.strategyId === strategy.id);
    const strategyData = {
      strategy,
      tasks: strategyTasks,
      players: strategy.players || [],
      timestamp: new Date().toISOString(),
      version: '2.0',
      metadata: {
        totalTasks: strategyTasks.length,
        activePlayers: strategy.players?.length || 0,
        lastModified: strategy.updatedAt,
        gameMode: 'Call of War'
      }
    };
    
    // Generate URL
    const encoded = btoa(JSON.stringify(strategyData));
    const shareableUrl = `${window.location.origin}${window.location.pathname}?shared=${encoded}`;
    setShareUrl(shareableUrl);
    
    // Generate share code
    const strategyPlayers = players.filter(player => strategy.players?.includes(player.id));
    const code = encodeStrategy(strategy, strategyTasks, strategyPlayers);
    setShareCode(code);
    
    // Generate QR code (simple data URL for demo)
    const qrData = `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#1a1a1a"/>
        <rect x="20" y="20" width="160" height="160" fill="#d4af37" rx="8"/>
        <text x="100" y="105" text-anchor="middle" fill="#1a1a1a" font-size="12" font-family="monospace">
          QR CODE\nSTRATEGY\nSHARE
        </text>
      </svg>
    `)}`;
    setQrCode(qrData);
    
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [key]: true });
      setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const shareViaEmail = () => {
    if (!strategy) return;
    const subject = encodeURIComponent(`Call of War Strategy: ${strategy.name}`);
    const body = encodeURIComponent(
      `I'm sharing my Call of War strategy "${strategy.name}" with you.\n\n` +
      `Strategy Overview:\n` +
      `• Description: ${strategy.description}\n` +
      `• Tasks: ${tasks.filter(t => t.strategyId === strategy.id).length}\n` +
      `• Duration: ${strategy.startDate.toLocaleDateString()} - ${strategy.endDate.toLocaleDateString()}\n\n` +
      `Access the strategy here: ${shareUrl}\n\n` +
      `Alternatively, use this share code in the app: ${shareCode}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSocial = (platform: string) => {
    if (!strategy) return;
    const text = encodeURIComponent(`Check out my Call of War strategy: ${strategy.name}`);
    const url = encodeURIComponent(shareUrl);
    
    const platforms = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      discord: shareUrl // Discord doesn't have direct share URL, so just copy link
    };
    
    if (platform === 'discord') {
      copyToClipboard(shareUrl, 'discord');
    } else {
      window.open(platforms[platform as keyof typeof platforms], '_blank');
    }
  };

  const downloadStrategy = () => {
    if (!strategy) return;
    const strategyTasks = tasks.filter(task => task.strategyId === strategy.id);
    const exportData = {
      strategy,
      tasks: strategyTasks,
      players: strategy.players || [],
      exportDate: new Date().toISOString(),
      version: '2.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${strategy.name.replace(/\s+/g, '_')}_strategy.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importStrategy = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        if (importData.strategy) {
          const importedStrategy = {
            ...importData.strategy,
            name: `${importData.strategy.name} (Imported)`,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          createStrategy(importedStrategy);
          
          if (importData.tasks && Array.isArray(importData.tasks)) {
            importData.tasks.forEach((task: any) => {
              createTask({
                ...task,
                strategyId: importedStrategy.id,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate)
              });
            });
          }
          
          if (importData.players && Array.isArray(importData.players)) {
            importData.players.forEach((player: any) => {
              addPlayer(player);
            });
          }
          
          alert('Strategy imported successfully!');
          onClose();
        }
      } catch (error) {
        alert('Failed to import strategy. Invalid file format.');
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  };

  React.useEffect(() => {
    if (isOpen && strategy) {
      generateShareableContent();
    }
  }, [isOpen, strategy?.id]);

  if (!isOpen || !strategy) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        
        <div className="relative z-10 bg-cod-primary border-2 border-cod-accent rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cod-accent/30">
            <h2 className="text-2xl font-bebas text-cod-accent flex items-center gap-2">
              <FaShare /> Share Strategy: {strategy.name}
            </h2>
            <button
              onClick={onClose}
              className="text-cod-accent hover:text-cod-accent/70 focus:outline-none transition-colors"
            >
              <FaTimes className="h-6 w-6" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-48 bg-cod-secondary/50 border-r border-cod-accent/20 p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('share')}
                  className={`w-full text-left px-3 py-2 rounded font-bebas transition-colors ${
                    activeTab === 'share'
                      ? 'bg-cod-accent text-cod-primary'
                      : 'text-cod-accent hover:bg-cod-accent/20'
                  }`}
                >
                  🔗 Share Links
                </button>
                <button
                  onClick={() => setActiveTab('collaborate')}
                  className={`w-full text-left px-3 py-2 rounded font-bebas transition-colors ${
                    activeTab === 'collaborate'
                      ? 'bg-cod-accent text-cod-primary'
                      : 'text-cod-accent hover:bg-cod-accent/20'
                  }`}
                >
                  <FaUsers /> Collaborate
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`w-full text-left px-3 py-2 rounded font-bebas transition-colors ${
                    activeTab === 'export'
                      ? 'bg-cod-accent text-cod-primary'
                      : 'text-cod-accent hover:bg-cod-accent/20'
                  }`}
                >
                  <FaDownload /> Export
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`w-full text-left px-3 py-2 rounded font-bebas transition-colors ${
                    activeTab === 'import'
                      ? 'bg-cod-accent text-cod-primary'
                      : 'text-cod-accent hover:bg-cod-accent/20'
                  }`}
                >
                  <FaUpload /> Import
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {/* Share Tab */}
              {activeTab === 'share' && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h3 className="text-xl font-bebas text-cod-accent mb-2">Share Your Strategy</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Choose how you want to share your strategy with alliance members
                    </p>
                  </div>

                  {/* Share Method Selection */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={() => setShareMethod('link')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        shareMethod === 'link'
                          ? 'border-cod-accent bg-cod-accent/20 text-cod-accent'
                          : 'border-cod-accent/30 text-gray-400 hover:border-cod-accent/50'
                      }`}
                    >
                      <FaExternalLinkAlt className="mx-auto mb-2" size={24} />
                      <div className="font-bebas">Direct Link</div>
                      <div className="text-xs">Instant access</div>
                    </button>
                    <button
                      onClick={() => setShareMethod('code')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        shareMethod === 'code'
                          ? 'border-cod-accent bg-cod-accent/20 text-cod-accent'
                          : 'border-cod-accent/30 text-gray-400 hover:border-cod-accent/50'
                      }`}
                    >
                      <FaCopy className="mx-auto mb-2" size={24} />
                      <div className="font-bebas">Share Code</div>
                      <div className="text-xs">Chat friendly</div>
                    </button>
                    <button
                      onClick={() => setShareMethod('qr')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        shareMethod === 'qr'
                          ? 'border-cod-accent bg-cod-accent/20 text-cod-accent'
                          : 'border-cod-accent/30 text-gray-400 hover:border-cod-accent/50'
                      }`}
                    >
                      <FaQrcode className="mx-auto mb-2" size={24} />
                      <div className="font-bebas">QR Code</div>
                      <div className="text-xs">Mobile scan</div>
                    </button>
                  </div>

                  {/* Share Content */}
                  {shareMethod === 'link' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-cod-secondary/50 rounded-lg">
                        <label className="block text-sm font-bebas text-cod-accent mb-2">Strategy URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={shareUrl}
                            readOnly
                            className="flex-1 px-3 py-2 bg-cod-secondary border border-cod-accent/30 rounded text-gray-300 text-sm"
                          />
                          <button
                            onClick={() => copyToClipboard(shareUrl, 'url')}
                            className="px-4 py-2 bg-cod-accent text-cod-primary rounded hover:bg-cod-accent/90 transition-colors font-bebas"
                          >
                            {copied.url ? <FaCheck /> : <FaCopy />}
                          </button>
                        </div>
                      </div>

                      {/* Social Sharing Options */}
                      <div className="border-t border-cod-accent/20 pt-4">
                        <h4 className="font-bebas text-cod-accent mb-3">Quick Share Options</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={shareViaEmail}
                            className="flex items-center gap-2 px-4 py-3 bg-cod-secondary/50 border border-cod-accent/30 rounded hover:bg-cod-accent/20 transition-colors text-gray-300"
                          >
                            <FaEnvelope /> Email
                          </button>
                          <button
                            onClick={() => shareViaSocial('discord')}
                            className="flex items-center gap-2 px-4 py-3 bg-cod-secondary/50 border border-cod-accent/30 rounded hover:bg-cod-accent/20 transition-colors text-gray-300"
                          >
                            <FaDiscord /> {copied.discord ? 'Copied!' : 'Discord'}
                          </button>
                          <button
                            onClick={() => shareViaSocial('telegram')}
                            className="flex items-center gap-2 px-4 py-3 bg-cod-secondary/50 border border-cod-accent/30 rounded hover:bg-cod-accent/20 transition-colors text-gray-300"
                          >
                            <FaTelegram /> Telegram
                          </button>
                          <button
                            onClick={() => shareViaSocial('whatsapp')}
                            className="flex items-center gap-2 px-4 py-3 bg-cod-secondary/50 border border-cod-accent/30 rounded hover:bg-cod-accent/20 transition-colors text-gray-300"
                          >
                            <FaWhatsapp /> WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {shareMethod === 'code' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-cod-secondary/50 rounded-lg">
                        <label className="block text-sm font-bebas text-cod-accent mb-2">Share Code</label>
                        <div className="p-3 bg-cod-secondary rounded font-mono text-cod-accent text-sm break-all border border-cod-accent/30">
                          {shareCode}
                        </div>
                        <button
                          onClick={() => copyToClipboard(shareCode, 'code')}
                          className="mt-2 w-full px-4 py-2 bg-cod-accent text-cod-primary rounded hover:bg-cod-accent/90 transition-colors font-bebas"
                        >
                          {copied.code ? <FaCheck className="inline mr-2" /> : <FaCopy className="inline mr-2" />}
                          {copied.code ? 'Copied!' : 'Copy Share Code'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Share this code in game chat, Discord, or other messaging platforms. Recipients can import it using the "Import Code" feature.
                      </div>
                    </div>
                  )}

                  {shareMethod === 'qr' && (
                    <div className="text-left space-y-4 flex flex-col items-center">
                      <div className="inline-block p-4 bg-white rounded-lg">
                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                      </div>
                      <p className="text-sm text-gray-400">
                        Scan this QR code with a mobile device to open the strategy
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Collaborate Tab */}
              {activeTab === 'collaborate' && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h3 className="text-xl font-bebas text-cod-accent mb-2">Real-time Collaboration</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Invite alliance members to collaborate on your strategy in real-time
                    </p>
                  </div>

                  {/* Real-time Toggle */}
                  <div className="p-4 bg-cod-secondary/50 rounded-lg border border-cod-accent/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bebas text-cod-accent">Enable Real-time Collaboration</span>
                      <button
                        onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                        className={`w-12 h-6 rounded-full border-2 transition-colors ${
                          realTimeEnabled
                            ? 'bg-cod-accent border-cod-accent'
                            : 'bg-cod-secondary border-cod-accent/30'
                        } relative`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-[1px] ${
                            realTimeEnabled ? 'translate-x-6' : 'translate-x-[1px]'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      When enabled, all collaborators will see live updates as changes are made
                    </p>
                  </div>

                  {/* Add Collaborator */}
                  <div className="p-4 bg-cod-secondary/50 rounded-lg border border-cod-accent/20">
                    <h4 className="font-bebas text-cod-accent mb-3">Invite Collaborators</h4>
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={collaboratorEmail}
                        onChange={(e) => setCollaboratorEmail(e.target.value)}
                        placeholder="Enter email address..."
                        className="w-full px-3 py-2 bg-cod-secondary border border-cod-accent/30 rounded text-gray-300"
                      />
                      <select
                        value={collaboratorRole}
                        onChange={(e) => setCollaboratorRole(e.target.value as any)}
                        className="w-full px-3 py-2 bg-cod-secondary border border-cod-accent/30 rounded text-gray-300"
                      >
                        <option value="viewer">Viewer - Can view strategy</option>
                        <option value="editor">Editor - Can edit tasks</option>
                        <option value="admin">Admin - Full access</option>
                      </select>
                      <button
                        onClick={() => {
                          if (collaboratorEmail) {
                            alert(`Invitation sent to ${collaboratorEmail} as ${collaboratorRole}`);
                            setCollaboratorEmail('');
                          }
                        }}
                        className="w-full px-4 py-2 bg-cod-accent text-cod-primary rounded hover:bg-cod-accent/90 transition-colors font-bebas"
                      >
                        Send Invitation
                      </button>
                    </div>
                  </div>

                  {/* Current Collaborators */}
                  <div className="p-4 bg-cod-secondary/50 rounded-lg border border-cod-accent/20">
                    <h4 className="font-bebas text-cod-accent mb-3">Current Collaborators</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-cod-secondary rounded">
                        <div className="flex items-center gap-2">
                          <FaCrown className="text-cod-accent" />
                          <span className="text-gray-300">You (Owner)</span>
                        </div>
                        <span className="text-xs text-gray-500">Full Access</span>
                      </div>
                      <div className="text-sm text-gray-500 text-left py-4">
                        No collaborators invited yet
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Tab */}
              {activeTab === 'export' && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h3 className="text-xl font-bebas text-cod-accent mb-2">Export Strategy</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Download your strategy for backup or offline sharing
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-6 bg-cod-secondary/50 rounded-lg border border-cod-accent/20 text-left flex flex-col items-center">
                      <FaDownload className="mx-auto mb-3 text-cod-accent" size={32} />
                      <h4 className="font-bebas text-cod-accent mb-2">JSON Format</h4>
                      <p className="text-sm text-gray-400 mb-4">
                        Complete strategy export including tasks, players, and metadata
                      </p>
                      <button
                        onClick={downloadStrategy}
                        className="px-6 py-3 bg-cod-accent text-cod-primary rounded hover:bg-cod-accent/90 transition-colors font-bebas"
                      >
                        Download JSON
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-cod-secondary/50 rounded-lg border border-cod-accent/20">
                    <h4 className="font-bebas text-cod-accent mb-2">Export Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Strategy Name:</span>
                        <div className="text-cod-accent">{strategy.name}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Tasks:</span>
                        <div className="text-cod-accent">{tasks.filter(t => t.strategyId === strategy.id).length}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <div className="text-cod-accent">
                          {Math.ceil((strategy.endDate.getTime() - strategy.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Last Modified:</span>
                        <div className="text-cod-accent">{strategy.updatedAt.toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Tab */}
              {activeTab === 'import' && (
                <div className="space-y-6">
                  <div className="text-left">
                    <h3 className="text-xl font-bebas text-cod-accent mb-2">Import Strategy</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Load strategies from files or share codes
                    </p>
                  </div>

                  {/* Import from File */}
                  <div className="p-6 bg-cod-secondary/50 rounded-lg border border-cod-accent/20">
                    <h4 className="font-bebas text-cod-accent mb-3 flex items-center gap-2">
                      <FaUpload /> Import from File
                    </h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Select a JSON strategy file to import
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={importStrategy}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 bg-cod-accent text-cod-primary rounded hover:bg-cod-accent/90 transition-colors font-bebas"
                    >
                      <FaUpload className="inline mr-2" /> Choose File
                    </button>
                  </div>

                  {/* Import from Code */}
                  <div className="p-6 bg-cod-secondary/50 rounded-lg border border-cod-accent/20">
                    <h4 className="font-bebas text-cod-accent mb-3">Import from Share Code</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Paste a share code to import someone else's strategy
                    </p>
                    <textarea
                      value={importCode}
                      onChange={(e) => setImportCode(e.target.value)}
                      placeholder="Paste share code here..."
                      className="w-full px-3 py-3 bg-cod-secondary border border-cod-accent/30 rounded text-gray-300 h-24 resize-none"
                    />
                    <button
                      onClick={() => {
                        if (importCode.trim()) {
                          const decoded = decodeStrategy(importCode.trim());
                          if (!decoded) {
                            alert('Invalid share code. Please check and try again.');
                            return;
                          }
                          
                          // Create the imported strategy
                          const importedStrategy = {
                            ...decoded.strategy,
                            name: `${decoded.strategy.name} (Imported)`,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          };
                          
                          createStrategy(importedStrategy);
                          
                          // Import tasks
                          decoded.tasks.forEach((task: any) => {
                            createTask({
                              ...task,
                              strategyId: importedStrategy.id,
                              startDate: new Date(task.startDate),
                              endDate: new Date(task.endDate)
                            });
                          });
                          
                          // Import players
                          decoded.players.forEach((player: any) => {
                            addPlayer(player);
                          });
                          
                          setImportCode('');
                          alert('Strategy imported successfully!');
                          onClose();
                        }
                      }}
                      disabled={!importCode.trim()}
                      className="mt-3 w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-bebas disabled:opacity-50"
                    >
                      Import Strategy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};