import React, { useRef, useEffect, useCallback, useState } from 'react';

export interface RemoteScreenProps {
  stream: MediaStream | null;
  onTouchDown?: (x: number, y: number) => void;
  onTouchUp?: (x: number, y: number) => void;
  onTouchMove?: (x: number, y: number) => void;
  className?: string;
  style?: React.CSSProperties;
  aspectRatio?: number;
  isVisible?: boolean;
}

export const RemoteScreen: React.FC<RemoteScreenProps> = ({
  stream,
  onTouchDown,
  onTouchUp,
  onTouchMove,
  className,
  style,
  aspectRatio: propAspectRatio,
  isVisible = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  // Calculate aspect ratio from video dimensions or use prop
  const aspectRatio = videoDimensions
    ? videoDimensions.width / videoDimensions.height
    : (propAspectRatio || 9 / 16);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      console.log('[RemoteScreen] Setting stream to video element');
      console.log('[RemoteScreen] Stream active:', stream.active);
      console.log('[RemoteScreen] Video tracks:', stream.getVideoTracks().length);

      stream.getVideoTracks().forEach((track, i) => {
        console.log(`[RemoteScreen] Video track ${i}:`, {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          settings: track.getSettings()
        });
      });

      video.srcObject = stream;

      // Force play
      video.play().then(() => {
        console.log('[RemoteScreen] Video playing');
      }).catch(err => {
        console.error('[RemoteScreen] Video play failed:', err);
      });

      // Monitor video element state
      const handleMetadata = () => {
        console.log('[RemoteScreen] Video metadata loaded:', video.videoWidth, 'x', video.videoHeight);
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
        }
      };

      const handleResize = () => {
        console.log('[RemoteScreen] Video resized:', video.videoWidth, 'x', video.videoHeight);
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
        }
      };

      video.onloadedmetadata = handleMetadata;
      video.onplaying = () => console.log('[RemoteScreen] Video is now playing');
      video.onstalled = () => console.warn('[RemoteScreen] Video stalled');
      video.onwaiting = () => console.log('[RemoteScreen] Video waiting for data');
      video.onresize = handleResize;

      return () => {
        video.onloadedmetadata = null;
        video.onplaying = null;
        video.onstalled = null;
        video.onwaiting = null;
        video.onresize = null;
      };
    } else {
      // Keep last known videoDimensions for aspect ratio stability on reconnect
      video.srcObject = null;
    }
  }, [stream]);

  // Periodically capture last frame to canvas (fallback for tab switch)
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !stream) return;

    const interval = setInterval(() => {
      if (video.videoWidth > 0 && video.videoHeight > 0 && !video.paused) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  // Re-attach stream when becoming visible again (tab switch recovery)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream || !isVisible) return;

    video.srcObject = stream;
    video.play().catch(() => {});
  }, [isVisible, stream]);

  const getNormalizedCoordinates = useCallback(
    (event: React.PointerEvent<HTMLVideoElement>) => {
      const video = videoRef.current;
      if (!video) return null;

      const rect = video.getBoundingClientRect();
      const videoW = video.videoWidth;
      const videoH = video.videoHeight;

      if (!videoW || !videoH) {
        // Fallback if video dimensions unknown
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
      }

      // Calculate actual video content area within the element (objectFit: contain)
      const videoAspect = videoW / videoH;
      const elemAspect = rect.width / rect.height;

      let renderedW: number, renderedH: number, offsetX: number, offsetY: number;

      if (videoAspect > elemAspect) {
        // Video wider than element — letterbox top/bottom
        renderedW = rect.width;
        renderedH = rect.width / videoAspect;
        offsetX = 0;
        offsetY = (rect.height - renderedH) / 2;
      } else {
        // Video taller than element — pillarbox left/right
        renderedH = rect.height;
        renderedW = rect.height * videoAspect;
        offsetX = (rect.width - renderedW) / 2;
        offsetY = 0;
      }

      const x = (event.clientX - rect.left - offsetX) / renderedW;
      const y = (event.clientY - rect.top - offsetY) / renderedH;

      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLVideoElement>) => {
      event.preventDefault();
      setIsPointerDown(true);

      const coords = getNormalizedCoordinates(event);
      if (coords && onTouchDown) {
        onTouchDown(coords.x, coords.y);
      }
    },
    [getNormalizedCoordinates, onTouchDown]
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLVideoElement>) => {
      event.preventDefault();
      setIsPointerDown(false);

      const coords = getNormalizedCoordinates(event);
      if (coords && onTouchUp) {
        onTouchUp(coords.x, coords.y);
      }
    },
    [getNormalizedCoordinates, onTouchUp]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLVideoElement>) => {
      if (!isPointerDown) return;
      event.preventDefault();

      const coords = getNormalizedCoordinates(event);
      if (coords && onTouchMove) {
        onTouchMove(coords.x, coords.y);
      }
    },
    [isPointerDown, getNormalizedCoordinates, onTouchMove]
  );

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLVideoElement>) => {
      if (isPointerDown) {
        setIsPointerDown(false);
        const coords = getNormalizedCoordinates(event);
        if (coords && onTouchUp) {
          onTouchUp(coords.x, coords.y);
        }
      }
    },
    [isPointerDown, getNormalizedCoordinates, onTouchUp]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      {/* Phone Bezel */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A1A1A',
          borderRadius: '24px',
          padding: '12px',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Phone Screen */}
        <div
          style={{
            position: 'relative',
            aspectRatio: String(aspectRatio),
            minHeight: 0,
            height: '100%',
            maxWidth: '100%',
            backgroundColor: '#0D0D0D',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {/* Last frame snapshot (shown when video has no new frames) */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              zIndex: 0,
            }}
          />
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              touchAction: 'none',
              cursor: 'pointer',
              zIndex: 1,
            }}
          />
          {!stream && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#606060',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#404040" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span style={{ fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>Waiting for connection...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
