import React, { useRef, useEffect, useCallback, useState } from 'react';

export interface RemoteScreenProps {
  stream: MediaStream | null;
  onTouchDown?: (x: number, y: number) => void;
  onTouchUp?: (x: number, y: number) => void;
  onTouchMove?: (x: number, y: number) => void;
  className?: string;
  style?: React.CSSProperties;
  aspectRatio?: number;
  showControls?: boolean;
  onBack?: () => void;
  onHome?: () => void;
  onRecent?: () => void;
}

export const RemoteScreen: React.FC<RemoteScreenProps> = ({
  stream,
  onTouchDown,
  onTouchUp,
  onTouchMove,
  className,
  style,
  aspectRatio: propAspectRatio,
  showControls = true,
  onBack,
  onHome,
  onRecent,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  // Calculate aspect ratio from video dimensions or use prop
  const aspectRatio = videoDimensions
    ? videoDimensions.width / videoDimensions.height
    : (propAspectRatio || 9 / 16);

  // Determine if landscape mode
  const isLandscape = aspectRatio > 1;

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
      // Reset when stream is removed
      setVideoDimensions(null);
      video.srcObject = null;
    }
  }, [stream]);

  const getNormalizedCoordinates = useCallback(
    (event: React.PointerEvent<HTMLVideoElement>) => {
      if (!videoRef.current) return null;

      const rect = videoRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        height: '100%',
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          // Fill available space while respecting aspect ratio
          width: '100%',
          minHeight: 0, // Important for flex child to shrink
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            // Use max dimensions and aspect ratio to fit within container
            maxWidth: '100%',
            maxHeight: '100%',
            aspectRatio: String(aspectRatio),
            // Both dimensions are constrained by max, but one dimension is 100%
            // Height-based for portrait (video is tall), width-based for landscape (video is wide)
            height: isLandscape ? 'auto' : '100%',
            width: isLandscape ? '100%' : 'auto',
            backgroundColor: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
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
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              touchAction: 'none',
              cursor: 'pointer',
            }}
          />
          {!stream && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#666',
                textAlign: 'center',
              }}
            >
              <p>No stream</p>
              <p style={{ fontSize: '12px' }}>Waiting for connection...</p>
            </div>
          )}
        </div>
      </div>

      {showControls && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            padding: '8px',
          }}
        >
          <button
            onClick={onBack}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            ◀ Back
          </button>
          <button
            onClick={onHome}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            ● Home
          </button>
          <button
            onClick={onRecent}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            ■ Recent
          </button>
        </div>
      )}
    </div>
  );
};
