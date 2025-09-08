import { useState, useCallback, useEffect } from 'react';
import { useSupabaseQuery } from '../hooks/useSupabase';

/**
 * SocialSharing.jsx - Ein-Klick Teilen auf Twitter, WhatsApp, Telegram
 * Features:
 * - Native Share API Unterstützung für mobile Geräte
 * - Anpassbare Share-Templates für verschiedene Content-Typen
 * - Cross-platform sharing functionality
 */
export default function SocialSharing({ 
  contentType = 'general', 
  customContent = null,
  onNavigate,
  showInline = true 
}) {
  const [shareData, setShareData] = useState(null);
  const [isNativeShareSupported, setIsNativeShareSupported] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Fetch data for generating share content
  const { data: matches } = useSupabaseQuery('matches', '*', { 
    order: { column: 'date', ascending: false },
    limit: 1
  });
  const { data: players } = useSupabaseQuery('players', '*');
  const { data: finances } = useSupabaseQuery('finances', '*');

  // Check for native share API support
  useEffect(() => {
    setIsNativeShareSupported(typeof navigator !== 'undefined' && 'share' in navigator);
  }, []);

  // Generate share content based on type
  const generateShareContent = useCallback(() => {
    if (customContent) {
      return customContent;
    }

    const baseUrl = window.location.origin;
    
    switch (contentType) {
      case 'match-result': {
        if (!matches || matches.length === 0) return null;
        
        const latestMatch = matches[0];
        const aekScore = latestMatch.aek_score || 0;
        const realScore = latestMatch.real_score || 0;
        const winner = aekScore > realScore ? 'AEK' : realScore > aekScore ? 'Real' : 'Unentschieden';
        const matchDate = new Date(latestMatch.date).toLocaleDateString('de-DE');
        
        return {
          title: `FIFA Tracker - Spielergebnis`,
          text: `🏆 Neuestes Ergebnis: AEK ${aekScore}:${realScore} Real\n${winner === 'Unentschieden' ? '🤝 Unentschieden!' : `🎉 ${winner} gewinnt!`}\n📅 ${matchDate}`,
          url: `${baseUrl}/#/matches`,
          hashtags: ['FIFATracker', 'Gaming', 'AEKvsReal']
        };
      }
      
      case 'team-stats': {
        if (!matches || !players) return null;
        
        const aekPlayers = players.filter(p => p.team === 'AEK').length;
        const realPlayers = players.filter(p => p.team === 'Real').length;
        const totalMatches = matches.length;
        
        return {
          title: `FIFA Tracker - Team-Statistiken`,
          text: `📊 FIFA Tracker Stats:\n👥 AEK: ${aekPlayers} Spieler\n👥 Real: ${realPlayers} Spieler\n⚽ ${totalMatches} Spiele gespielt\n\nJetzt anschauen:`,
          url: `${baseUrl}/#/stats`,
          hashtags: ['FIFATracker', 'TeamStats', 'Gaming']
        };
      }
      
      case 'financial-summary': {
        if (!finances) return null;
        
        const aekBalance = finances.find(f => f.team === 'AEK')?.balance || 0;
        const realBalance = finances.find(f => f.team === 'Real')?.balance || 0;
        const totalBalance = aekBalance + realBalance;
        
        return {
          title: `FIFA Tracker - Finanzen`,
          text: `💰 FIFA Tracker Finanzen:\n💛 AEK: ${aekBalance}€\n🤍 Real: ${realBalance}€\n📈 Gesamt: ${totalBalance}€`,
          url: `${baseUrl}/#/finanzen`,
          hashtags: ['FIFATracker', 'Finanzen', 'Gaming']
        };
      }
      
      case 'app-invite': {
        return {
          title: `FIFA Tracker - Invite`,
          text: `🎮 Schau dir den FIFA Tracker an!\n\n📊 Detaillierte Statistiken\n💰 Finanz-Management\n🏆 Team-Vergleiche\n📱 Mobile-optimiert\n\nJetzt ausprobieren:`,
          url: baseUrl,
          hashtags: ['FIFATracker', 'Gaming', 'WebApp']
        };
      }
      
      case 'achievement': {
        return {
          title: `FIFA Tracker - Erfolg`,
          text: `🏅 Neuer Erfolg im FIFA Tracker!\n\n🎯 Meilenstein erreicht\n📈 Performance verbessert\n\nMeine Fortschritte ansehen:`,
          url: `${baseUrl}/#/stats`,
          hashtags: ['FIFATracker', 'Achievement', 'Gaming']
        };
      }
      
      default: {
        return {
          title: `FIFA Tracker`,
          text: `🎮 Professionelles FIFA-Management mit dem FIFA Tracker!\n\n✨ Features:\n📊 Live-Statistiken\n💰 Finanz-Tracking\n🏆 Team-Vergleiche\n📱 Mobile-ready\n\nJetzt kostenlos nutzen:`,
          url: baseUrl,
          hashtags: ['FIFATracker', 'Gaming', 'WebApp']
        };
      }
    }
  }, [contentType, customContent, matches, players, finances]);

  // Update share data when content changes
  useEffect(() => {
    const content = generateShareContent();
    setShareData(content);
  }, [generateShareContent]);

  // Native share function
  const handleNativeShare = useCallback(async () => {
    if (!shareData || !isNativeShareSupported) return;

    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.text,
        url: shareData.url
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Native share failed:', error);
        setShowShareModal(true);
      }
    }
  }, [shareData, isNativeShareSupported]);

  // Platform-specific share functions
  const shareToTwitter = useCallback(() => {
    if (!shareData) return;
    
    const text = `${shareData.text}\n${shareData.url}`;
    const hashtags = shareData.hashtags?.join(',') || '';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=${encodeURIComponent(hashtags)}`;
    window.open(url, '_blank', 'width=550,height=420');
  }, [shareData]);

  const shareToWhatsApp = useCallback(() => {
    if (!shareData) return;
    
    const text = `${shareData.text}\n${shareData.url}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [shareData]);

  const shareToTelegram = useCallback(() => {
    if (!shareData) return;
    
    const text = `${shareData.text}\n${shareData.url}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`;
    window.open(url, '_blank');
  }, [shareData]);

  const shareToFacebook = useCallback(() => {
    if (!shareData) return;
    
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent(shareData.text)}`;
    window.open(url, '_blank', 'width=555,height=655');
  }, [shareData]);

  const shareToLinkedIn = useCallback(() => {
    if (!shareData) return;
    
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}&summary=${encodeURIComponent(shareData.text)}`;
    window.open(url, '_blank', 'width=550,height=550');
  }, [shareData]);

  const copyToClipboard = useCallback(async () => {
    if (!shareData) return;
    
    const text = `${shareData.text}\n${shareData.url}`;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }, [shareData]);

  if (!shareData) {
    return null;
  }

  if (!showInline) {
    return null;
  }

  return (
    <>
      {/* Inline Share Buttons */}
      <div className="social-sharing space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-text-primary">Teilen:</span>
          <div className="h-px bg-border flex-1"></div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Native Share (Mobile) */}
          {isNativeShareSupported && (
            <button
              onClick={handleNativeShare}
              className="share-button bg-primary text-white hover:bg-primary-dark"
              title="Teilen"
            >
              <span className="text-lg">📱</span>
              <span className="ml-2">Teilen</span>
            </button>
          )}
          
          {/* Platform-specific buttons */}
          <button
            onClick={shareToWhatsApp}
            className="share-button bg-green-500 text-white hover:bg-green-600"
            title="WhatsApp"
          >
            <span className="text-lg">💬</span>
            <span className="ml-2">WhatsApp</span>
          </button>
          
          <button
            onClick={shareToTwitter}
            className="share-button bg-blue-500 text-white hover:bg-blue-600"
            title="Twitter"
          >
            <span className="text-lg">🐦</span>
            <span className="ml-2">Twitter</span>
          </button>
          
          <button
            onClick={shareToTelegram}
            className="share-button bg-blue-400 text-white hover:bg-blue-500"
            title="Telegram"
          >
            <span className="text-lg">✈️</span>
            <span className="ml-2">Telegram</span>
          </button>
          
          <button
            onClick={shareToFacebook}
            className="share-button bg-blue-600 text-white hover:bg-blue-700"
            title="Facebook"
          >
            <span className="text-lg">📘</span>
            <span className="ml-2">Facebook</span>
          </button>
          
          <button
            onClick={shareToLinkedIn}
            className="share-button bg-blue-700 text-white hover:bg-blue-800"
            title="LinkedIn"
          >
            <span className="text-lg">💼</span>
            <span className="ml-2">LinkedIn</span>
          </button>
          
          <button
            onClick={copyToClipboard}
            className={`share-button ${copiedToClipboard 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
            title="Link kopieren"
          >
            <span className="text-lg">{copiedToClipboard ? '✓' : '📋'}</span>
            <span className="ml-2">{copiedToClipboard ? 'Kopiert!' : 'Kopieren'}</span>
          </button>
          
          <button
            onClick={() => setShowShareModal(true)}
            className="share-button bg-gray-400 text-white hover:bg-gray-500"
            title="Weitere Optionen"
          >
            <span className="text-lg">⋯</span>
            <span className="ml-2">Mehr</span>
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-primary rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Teilen</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                ×
              </button>
            </div>
            
            {/* Preview */}
            <div className="share-preview bg-bg-secondary rounded-lg p-4">
              <h4 className="font-medium text-text-primary mb-2">{shareData.title}</h4>
              <p className="text-sm text-text-secondary whitespace-pre-line">{shareData.text}</p>
              <div className="text-xs text-primary mt-2 break-all">{shareData.url}</div>
            </div>
            
            {/* All Share Options */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  shareToWhatsApp();
                  setShowShareModal(false);
                }}
                className="flex items-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <span className="text-lg">💬</span>
                <span>WhatsApp</span>
              </button>
              
              <button
                onClick={() => {
                  shareToTwitter();
                  setShowShareModal(false);
                }}
                className="flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <span className="text-lg">🐦</span>
                <span>Twitter</span>
              </button>
              
              <button
                onClick={() => {
                  shareToTelegram();
                  setShowShareModal(false);
                }}
                className="flex items-center gap-2 p-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                <span className="text-lg">✈️</span>
                <span>Telegram</span>
              </button>
              
              <button
                onClick={() => {
                  shareToFacebook();
                  setShowShareModal(false);
                }}
                className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="text-lg">📘</span>
                <span>Facebook</span>
              </button>
              
              <button
                onClick={() => {
                  shareToLinkedIn();
                  setShowShareModal(false);
                }}
                className="flex items-center gap-2 p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <span className="text-lg">💼</span>
                <span>LinkedIn</span>
              </button>
              
              <button
                onClick={() => {
                  copyToClipboard();
                  setShowShareModal(false);
                }}
                className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${
                  copiedToClipboard
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                <span className="text-lg">{copiedToClipboard ? '✓' : '📋'}</span>
                <span>{copiedToClipboard ? 'Kopiert!' : 'Kopieren'}</span>
              </button>
            </div>
            
            {/* Custom Message */}
            <div className="text-xs text-text-secondary text-center">
              Teile deine FIFA Tracker Ergebnisse mit Freunden!
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Quick Share Component for easy integration
export function QuickShare({ type, content, className = "" }) {
  return (
    <div className={`quick-share ${className}`}>
      <SocialSharing 
        contentType={type} 
        customContent={content}
        showInline={true}
      />
    </div>
  );
}

// Share Button Component
export function ShareButton({ 
  type, 
  content, 
  buttonText = "Teilen", 
  buttonClass = "modern-button-secondary",
  iconClass = ""
}) {
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowShare(!showShare)}
        className={buttonClass}
      >
        <span className={iconClass}>🔗</span>
        {buttonText}
      </button>
      
      {showShare && (
        <div className="absolute top-full left-0 mt-2 bg-bg-primary border border-border rounded-lg shadow-lg p-4 z-40 min-w-64">
          <SocialSharing 
            contentType={type} 
            customContent={content}
            showInline={true}
          />
          <button
            onClick={() => setShowShare(false)}
            className="text-xs text-text-secondary hover:text-text-primary mt-2"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  );
}