import React, { useState } from 'react';
import { useStrategyStore } from '../../store/useStrategyStore';
import { useCurrentStrategy } from '../../hooks/useCurrentStrategy';
import { FaShare, FaDownload, FaUpload, FaCopy, FaCheck, FaGlobe } from 'react-icons/fa';

export const StrategySharing: React.FC = () => {
  const { strategies, createStrategy } = useStrategyStore();
  const { strategy } = useCurrentStrategy();
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const generateShareableLink = async () => {
    if (!strategy) return;

    setIsSharing(true);
    
    // Simulate generating a shareable link (in a real app, this would call an API)
    const strategyData = {
      strategy,
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

  const exportStrategy = () => {
    if (!strategy) return;

    const exportData = {
      strategy,
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
          
          createStrategy(importedStrategy);
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
          
          createStrategy(sharedStrategy);
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          alert('Shared strategy loaded successfully!');
        }
      } catch (error) {
        console.error('Failed to load shared strategy:', error);
      }
    }
  }, [createStrategy]);

  return (
    <div className="bg-cod-secondary/90 backdrop-blur-sm p-4 rounded-lg shadow-2xl border-2 border-cod-accent/20">
      <h2 className="text-2xl font-bebas text-cod-accent mb-4 flex items-center gap-2">
        <FaShare /> Strategy Sharing
      </h2>

      <div className="space-y-4">
        {/* Share Strategy */}
        <div className="p-4 bg-cod-primary/30 rounded-lg border border-cod-accent/20">
          <h3 className="font-bebas text-cod-accent mb-2 flex items-center gap-2">
            <FaGlobe /> Share Current Strategy
          </h3>
          <p className="text-sm text-gray-400 mb-3">
            Generate a shareable link for your alliance members
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