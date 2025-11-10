import { mergeClasses } from '@expo/styleguide';
import { useInView } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';

import { LightboxImage } from './LightboxImage';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

const PLAYER_WIDTH = '100%';
const PLAYER_HEIGHT = '100%';

type ContentSpotlightProps = {
  alt?: string;
  src?: string;
  file?: string;
  videoId?: string;
  caption?: string;
  controls?: any;
  loop?: boolean;
  className?: string;
  containerClassName?: string;
  playerWidth?: string | number;
  playerHeight?: string | number;
  autoplayYT?: boolean;
};

export function ContentSpotlight({
  alt,
  src,
  file,
  videoId,
  caption,
  controls = true,
  loop = true,
  className,
  containerClassName,
  playerWidth,
  playerHeight,
  autoplayYT = true,
}: ContentSpotlightProps) {
  const [forceShowControls, setForceShowControls] = useState<boolean>();
  const resolvedPlayerWidth = playerWidth ?? PLAYER_WIDTH;
  const resolvedPlayerHeight = playerHeight ?? PLAYER_HEIGHT;
  const hasCustomPlayerSize =
    typeof playerWidth !== 'undefined' || typeof playerHeight !== 'undefined';
  const getDimensionValue = (value: string | number) =>
    `${value}${typeof value === 'number' ? 'px' : ''}`;
  const resolvedFileUrl =
    file && (/^https?:\/\/|^\/\//.test(file) ? file : `/static/videos/${file}`);
  const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : resolvedFileUrl;
  const playerRef = useRef(null);
  const isInView = useInView(playerRef);
  const isVideo = !!videoUrl;
  const shouldAutoplay = isInView && isVideo && (!videoId || autoplayYT);

  return (
    <figure
      className={mergeClasses(
        'my-5 cursor-pointer rounded-lg py-2.5 text-center',
        containerClassName,
        !isVideo && 'bg-subtle'
      )}
      onClick={() => {
        if (typeof controls === 'undefined' && !forceShowControls) {
          setForceShowControls(true);
        }
      }}>
      {src ? (
        <LightboxImage
          src={src}
          alt={alt}
          className={mergeClasses(
            'inline rounded-md transition-opacity duration-default ease-in-out hover:opacity-80',
            className
          )}
        />
      ) : isVideo ? (
        <div
          className={mergeClasses(
            'relative overflow-hidden rounded-lg bg-palette-black',
            hasCustomPlayerSize ? 'mx-auto' : 'aspect-video'
          )}
          ref={playerRef}
          style={
            hasCustomPlayerSize
              ? {
                  width: getDimensionValue(resolvedPlayerWidth),
                  height: getDimensionValue(resolvedPlayerHeight),
                }
              : undefined
          }>
          <ReactPlayer
            src={videoUrl}
            className="react-player"
            width={resolvedPlayerWidth}
            height={resolvedPlayerHeight}
            muted
            playing={shouldAutoplay}
            controls={typeof controls === 'undefined' ? forceShowControls : controls}
            playsInline
            loop={loop}
          />
          <div
            className={mergeClasses(
              'pointer-events-none absolute inset-0 transition-opacity duration-500 max-md-gutters:hidden',
              isInView ? 'opacity-0' : 'opacity-70'
            )}
          />
        </div>
      ) : null}
      {caption && (
        <figcaption
          className={mergeClasses(
            'mt-3.5 cursor-text px-8 py-2 text-center text-xs text-secondary',
            isVideo && 'bg-transparent'
          )}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
