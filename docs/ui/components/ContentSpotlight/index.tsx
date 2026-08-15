import { mergeClasses, useTheme } from '@expo/styleguide';
import { useInView } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { prefersDarkTheme } from '~/common/window';
import { DotGrid } from '~/ui/components/Diagram/DotGrid';

import { LightboxImage } from './LightboxImage';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

const PLAYER_WIDTH = '100%';
const PLAYER_HEIGHT = '100%';

const ASPECT_CLASS = {
  landscape: 'aspect-[3/2] w-[540px]',
  portrait: 'aspect-[9/16] w-[220px]',
} as const;

type ContentSpotlightVariant = 'screenshot' | 'component';
type ContentSpotlightAspect = keyof typeof ASPECT_CLASS;

type ContentSpotlightProps = {
  alt?: string;
  src?: string;
  darkSrc?: string;
  width?: number;
  height?: number;
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
  variant?: ContentSpotlightVariant;
  aspect?: ContentSpotlightAspect;
};

export function ContentSpotlight({
  alt,
  src,
  darkSrc,
  width,
  height,
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
  variant = 'screenshot',
  aspect,
}: ContentSpotlightProps) {
  const [forceShowControls, setForceShowControls] = useState<boolean>();
  const { themeName } = useTheme();
  const [isDark, setDark] = useState(themeName === 'dark');

  useEffect(() => {
    if (themeName === 'auto') {
      setDark(prefersDarkTheme());
    } else {
      setDark(themeName === 'dark');
    }
  }, [themeName]);

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

  const isComponentVariant = variant === 'component' && !isVideo;
  const activeSrc = isDark && darkSrc ? darkSrc : src;

  return (
    <figure
      className={mergeClasses(
        'my-5 cursor-pointer rounded-lg py-2.5 text-center',
        containerClassName,
        !isVideo && !isComponentVariant && 'bg-subtle',
        isComponentVariant &&
          'relative mx-auto my-6 max-w-full cursor-auto overflow-hidden rounded-md border border-default bg-default py-0',
        isComponentVariant && aspect && ASPECT_CLASS[aspect]
      )}
      onClick={() => {
        if (typeof controls === 'undefined' && !forceShowControls) {
          setForceShowControls(true);
        }
      }}>
      {src && isComponentVariant ? (
        <>
          <DotGrid />
          <picture className="relative block size-full">
            {isDark && darkSrc && <source srcSet={darkSrc} />}
            <img src={src} alt={alt} className="size-full object-cover" />
          </picture>
        </>
      ) : src ? (
        <LightboxImage
          src={activeSrc ?? src}
          alt={alt}
          width={width}
          height={height}
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
              'pointer-events-none absolute inset-0 transition-opacity duration-500 max-md:hidden',
              isInView ? 'opacity-0' : 'opacity-70'
            )}
          />
        </div>
      ) : null}
      {caption && (
        <figcaption
          className={mergeClasses(
            'mt-3.5 cursor-text px-8 py-2 text-center text-sm text-secondary',
            isVideo && 'bg-transparent'
          )}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
