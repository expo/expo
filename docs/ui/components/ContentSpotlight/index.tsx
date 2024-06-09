import { mergeClasses } from '@expo/styleguide';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { type CSSProperties } from 'react';
import VisibilitySensor from 'react-visibility-sensor';

import { LightboxImage } from './LightboxImage';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

const PLAYER_WIDTH = '100%' as const;
const PLAYER_HEIGHT = 400 as const;
const YOUTUBE_DOMAINS = ['youtube.com', 'youtu.be'] as const;

type ContentSpotlightProps = {
  alt?: string;
  src?: string;
  url?: string;
  file?: string;
  caption?: string;
  controls?: any;
  spaceAfter?: boolean | number;
  loop?: boolean;
  style?: CSSProperties;
  containerClassName?: string;
};

export function ContentSpotlight({
  alt,
  src,
  url,
  file,
  caption,
  controls,
  spaceAfter,
  loop = true,
  style,
  containerClassName,
}: ContentSpotlightProps) {
  const isYouTubeDomain = (url?: string) => {
    return url ? YOUTUBE_DOMAINS.some(domain => url.includes(domain)) : false;
  };

  const getInitialMarginBottom = (spaceAfter: ContentSpotlightProps['spaceAfter']) => {
    if (typeof spaceAfter === 'undefined') {
      return 'mb-4';
    } else if (typeof spaceAfter === 'number') {
      return `mb-${spaceAfter}`;
    } else if (spaceAfter) {
      return 'mb-12';
    }
    return 'mb-0';
  };

  const [hover, setHover] = useState(false);
  const [forceShowControls, setForceShowControls] = useState(isYouTubeDomain(url));
  const isVideo = !!(url || file);

  return (
    <figure
      className={mergeClasses(
        'text-center py-2.5 my-5 rounded-lg',
        containerClassName,
        !isVideo && 'bg-subtle'
      )}
      onClick={() => {
        if (typeof controls === 'undefined' && !forceShowControls) {
          setForceShowControls(true);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={hover ? { cursor: 'pointer' } : undefined}>
      {src ? (
        <LightboxImage
          src={src}
          alt={alt}
          style={style}
          className="inline rounded-md transition-opacity duration-default ease-in-out hover:opacity-80"
        />
      ) : isVideo ? (
        <VisibilitySensor partialVisibility>
          {({ isVisible }: { isVisible: boolean }) => (
            <div className={getInitialMarginBottom(spaceAfter)}>
              <div className="relative w-full h-[400px] bg-palette-black rounded-lg overflow-hidden">
                <ReactPlayer
                  url={isVisible ? url || `/static/videos/${file}` : undefined}
                  className="react-player"
                  width={PLAYER_WIDTH}
                  height={PLAYER_HEIGHT}
                  style={{
                    outline: 'none',
                    backgroundColor: '#000',
                  }}
                  muted
                  playing={isVisible && !!file}
                  controls={typeof controls === 'undefined' ? forceShowControls : controls}
                  playsinline
                  loop={loop}
                />
                <div
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                    isVisible ? 'opacity-0' : 'opacity-70'
                  } md:hidden`}
                />
              </div>
            </div>
          )}
        </VisibilitySensor>
      ) : null}
      {caption && (
        <figcaption
          className={`mt-[14px] text-secondary text-center text-xs px-8 py-2 ${
            isVideo ? 'bg-transparent' : ''
          }`}
          style={hover ? { cursor: 'auto' } : undefined}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default ContentSpotlight;
