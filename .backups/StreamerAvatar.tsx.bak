import React, { useState, useEffect } from 'react';
import { requestStreamerAvatar, subscribeAvatarCache } from '../utils/avatarCache';

interface StreamerAvatarProps {
  channelName: string;
  className?: string;
  showFallbackText?: boolean;
}

export const StreamerAvatar: React.FC<StreamerAvatarProps> = ({
  channelName,
  className = "w-8 h-8 rounded-lg",
  showFallbackText = true
}) => {
  const cleanName = channelName ? channelName.trim().replace(/^@/, '') : '';
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => requestStreamerAvatar(cleanName));
  const [imgFailed, setImgFailed] = useState(false);
  const [fallbackStep, setFallbackStep] = useState(0);

  useEffect(() => {
    if (!cleanName) return;

    // Check cache immediately
    const cached = requestStreamerAvatar(cleanName);
    if (cached) {
      setAvatarUrl(cached);
    }

    // Subscribe to batch cache updates
    const unsubscribe = subscribeAvatarCache(() => {
      const updated = requestStreamerAvatar(cleanName);
      if (updated) {
        setAvatarUrl(updated);
        setImgFailed(false);
      }
    });

    return unsubscribe;
  }, [cleanName]);

  // Handle image load error
  const handleError = () => {
    if (fallbackStep === 0) {
      // Try unavatar as fallback step 1
      setFallbackStep(1);
      setAvatarUrl(`https://unavatar.io/twitch/${encodeURIComponent(cleanName)}`);
    } else {
      // Fallback failed, display initial badge
      setImgFailed(true);
    }
  };

  if (!cleanName || (imgFailed && !avatarUrl)) {
    return (
      <div
        className={`bg-gradient-to-br from-[#9146FF] to-indigo-800 flex items-center justify-center text-white font-bold font-mono text-xs shadow-inner border border-[#9146FF]/40 shrink-0 ${className}`}
        title={channelName}
      >
        {showFallbackText && cleanName ? cleanName.slice(0, 2).toUpperCase() : '??'}
      </div>
    );
  }

  // Active URL or waiting for IVR batch response
  const currentSrc = avatarUrl || `https://unavatar.io/twitch/${encodeURIComponent(cleanName)}`;

  return (
    <img
      src={currentSrc}
      alt={channelName}
      className={`object-cover bg-black/20 shrink-0 ${className}`}
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
};
