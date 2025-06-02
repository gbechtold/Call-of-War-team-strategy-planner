import React, { useState } from 'react';
import { useStrategyStore } from '../../store/useStrategyStore';
import { useCurrentStrategy } from '../../hooks/useCurrentStrategy';
import { FaShare, FaDownload, FaUpload, FaCopy, FaCheck, FaGlobe, FaCode } from 'react-icons/fa';
import { encodeStrategy, decodeStrategy } from '../../utils/shareCode';

export const StrategySharing: React.FC = () => {
  const { strategies, createStrategy, createTask, addPlayer, tasks, players, saveStrategyWithCode } = useStrategyStore();
  const { strategy } = useCurrentStrategy();
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shareCode, setShareCode] = useState<string>('');
  const [importCode, setImportCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const generateShareableLink = async () => {
    if (!strategy) return;

    setIsSharing(true);
    
    // Include strategy, tasks, and players in the shareable data
    const strategyTasks = tasks.filter(task => task.strategyId === strategy.id);
    const strategyData = {
      strategy,
      tasks: strategyTasks,
      players: strategy.players || [],
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    // In a real implementation, you'd send this to a backend
    const encoded = btoa(JSON.stringify(strategyData));
    const shareableUrl = `${window.location.origin}${window.location.pathname}?shared=${encoded}`;
    
    setShareUrl(shareableUrl);
    setIsSharing(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const generateShareCode = () => {
    if (!strategy) return;
    
    const strategyTasks = tasks.filter(task => task.strategyId === strategy.id);
    const strategyPlayers = players.filter(player => strategy.players?.includes(player.id));
    const code = encodeStrategy(strategy, strategyTasks, strategyPlayers);
    setShareCode(code);
  };

  const saveCurrentStrategy = () => {
    if (!shareCode) {
      generateShareCode();
      return;
    }
    
    saveStrategyWithCode(shareCode);
    alert('Strategy saved locally!');
  };

  const copyShareCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share code:', err);
    }
  };

  const importFromCode = () => {
    if (!importCode.trim()) return;
    
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
  };

  const exportStrategy = () => {
    if (!strategy) return;

    // Include strategy, tasks, and players in the export
    const strategyTasks = tasks.filter(task => task.strategyId === strategy.id);
    const exportData = {
      strategy,
      tasks: strategyTasks,
      players: strategy.players || [],
      exportDate: new Date().toISOString(),
      version: '1.0'
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
          
          // Create the strategy first
          createStrategy(importedStrategy);
          
          // Import tasks if they exist
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
          
          // Import players if they exist
          if (importData.players && Array.isArray(importData.players)) {
            importData.players.forEach((player: any) => {
              addPlayer(player);
            });
          }
          
          alert('Strategy imported successfully!');
        }
      } catch (error) {
        alert('Failed to import strategy. Invalid file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  // Check for shared strategy in URL on component mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('shared');
    
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(sharedData));
        if (decoded.strategy) {
          const sharedStrategy = {
            ...decoded.strategy,
            name: `${decoded.strategy.name} (Shared)`,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Create the strategy first
          createStrategy(sharedStrategy);
          
          // Load tasks if they exist
          if (decoded.tasks && Array.isArray(decoded.tasks)) {
            decoded.tasks.forEach((task: any) => {
              createTask({
                ...task,
                strategyId: sharedStrategy.id,
                startDate: new Date(task.startDate),
                endDate: new Date(task.endDate)
              });
            });
          }
          
          // Load players if they exist
          if (decoded.players && Array.isArray(decoded.players)) {
            decoded.players.forEach((player: any) => {
              addPlayer(player);
            });
          }
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          alert('Shared strategy loaded successfully!');
        }
      } catch (error) {
        console.error('Failed to load shared strategy:', error);
        alert('Failed to load shared strategy. The link may be invalid or corrupted.');
      }
    }
  }, [createStrategy, createTask, addPlayer]);

  return (
    <div className="bg-cod-secondary/90 backdrop-blur-sm p-3 rounded-lg shadow-2xl border-2 border-cod-accent/20 w-56">
      <h2 className="text-lg font-bebas text-cod-accent mb-3 flex items-center gap-2">
        <FaShare /> Share
      </h2>

      <div className="space-y-3">
        {/* Share Strategy */}
        <div className="p-2 bg-cod-primary/30 rounded border border-cod-accent/20">
          <h3 className="font-bebas text-cod-accent mb-1 flex items-center gap-1 text-sm">
            <FaGlobe /> Share Link
          </h3>
          <p className="text-xs text-gray-400 mb-2">
            Generate link for alliance
          </p>
          
          {!shareUrl ? (
            <button
              onClick={generateShareableLink}
              disabled={!strategy || isSharing}
              className="flex items-center gap-2 px-4 py-2 bg-cod-accent text-cod-primary rounded-md hover:bg-cod-accent/90 transition-colors font-bebas disabled:opacity-50"
            >
              <FaShare /> {isSharing ? 'Generating...' : 'Generate Share Link'}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 text-xs px-2 py-1 bg-cod-secondary border border-cod-accent/30 rounded text-gray-300"
                />
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 px-3 py-1 bg-cod-accent text-cod-primary rounded hover:bg-cod-accent/90 transition-colors font-bebas text-sm"
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Share this link with your alliance members to collaborate
              </p>
            </div>
          )}
        </div>

        {/* Share Code */}
        <div className="p-2 bg-cod-primary/30 rounded border border-cod-accent/20">
          <h3 className="font-bebas text-cod-accent mb-1 flex items-center gap-1 text-sm">
            <FaCode /> Share Code
          </h3>
          <p className="text-xs text-gray-400 mb-2">
            Generate a code to share
          </p>
          
          {!shareCode ? (
            <button
              onClick={generateShareCode}
              disabled={!strategy}
              className="flex items-center gap-2 px-3 py-2 bg-cod-accent text-cod-primary rounded hover:bg-cod-accent/90 transition-colors font-bebas text-sm disabled:opacity-50 w-full"
            >
              <FaCode /> Generate Code
            </button>
          ) : (
            <div className="space-y-2">
              <div className="p-2 bg-cod-secondary rounded text-xs font-mono text-cod-accent break-all">
                {shareCode.split('-').slice(0, 4).join('-')}...
              </div>
              <button
                onClick={copyShareCode}
                className="flex items-center gap-1 px-3 py-1 bg-cod-accent text-cod-primary rounded hover:bg-cod-accent/90 transition-colors font-bebas text-sm w-full"
              >
                {codeCopied ? <FaCheck /> : <FaCopy />}
                {codeCopied ? 'Copied!' : 'Copy Full Code'}
              </button>
              <button
                onClick={saveCurrentStrategy}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-bebas text-sm w-full"
              >
                <FaDownload /> Save Strategy Locally
              </button>
              <p className="text-xs text-gray-500">
                Share this code in game chat or Discord
              </p>
            </div>
          )}
        </div>

        {/* Import Code */}
        <div className="p-2 bg-cod-primary/30 rounded border border-cod-accent/20">
          <h3 className="font-bebas text-cod-accent mb-1 flex items-center gap-1 text-sm">
            <FaUpload /> Import Code
          </h3>
          <p className="text-xs text-gray-400 mb-2">
            Load strategy from code
          </p>
          <input
            type="text"
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
            placeholder="Paste code here..."
            className="w-full px-2 py-1 text-xs bg-cod-secondary border border-cod-accent/30 rounded text-gray-300 mb-2"
          />
          <button
            onClick={importFromCode}
            disabled={!importCode.trim()}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-bebas text-sm disabled:opacity-50 w-full"
          >
            <FaUpload /> Import
          </button>
        </div>

        {/* Export Strategy */}
        <div className="p-4 bg-cod-primary/30 rounded-lg border border-cod-accent/20">
          <h3 className="font-bebas text-cod-accent mb-2 flex items-center gap-2">
            <FaDownload /> Export Strategy
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Download strategy as JSON file for backup or sharing
          </p>
          
          <button
            onClick={exportStrategy}
            disabled={!strategy}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-bebas disabled:opacity-50"
          >
            <FaDownload /> Export JSON
          </button>
        </div>

        {/* Import Strategy */}
        <div className="p-4 bg-cod-primary/30 rounded-lg border border-cod-accent/20">
          <h3 className="font-bebas text-cod-accent mb-2 flex items-center gap-2">
            <FaUpload /> Import Strategy
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Load a strategy from a JSON file
          </p>
          
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-bebas cursor-pointer">
            <FaUpload /> Import JSON
            <input
              type="file"
              accept=".json"
              onChange={importStrategy}
              className="hidden"
            />
          </label>
        </div>

        {/* Strategy List */}
        {strategies.length > 1 && (
          <div className="p-4 bg-cod-primary/30 rounded-lg border border-cod-accent/20">
            <h3 className="font-bebas text-cod-accent mb-2">Available Strategies</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {strategies.map((strat) => (
                <div
                  key={strat.id}
                  className={`p-2 rounded border text-sm ${
                    strat.id === strategy?.id
                      ? 'border-cod-accent bg-cod-accent/20 text-cod-accent'
                      : 'border-cod-accent/30 bg-cod-secondary/50 text-gray-300'
                  }`}
                >
                  <div className="font-bebas">{strat.name}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(strat.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};