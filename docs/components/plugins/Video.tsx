import { css } from '@emotion/react';
import { borderRadius, breakpoints } from '@expo/styleguide-base';
import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import VisibilitySensor from 'react-visibility-sensor';

const PLAYER_WIDTH = '100%' as const;
const PLAYER_HEIGHT = 400 as const;
const YOUTUBE_DOMAINS = ['youtube.com', 'youtu.be'] as const;

type VideoProps = React.PropsWithChildren<{
  controls?: any;
  spaceAfter?: boolean | number;
  url?: string;
  file?: string;
  loop?: boolean;
}>;

const Video = ({ controls, spaceAfter, url, file, loop = true }: VideoProps) => {
  const [hover, setHover] = useState(false);
  const [forceShowControls, setForceShowControls] = useState(isYouTubeDomain(url));

  return (
    <div
      onClick={() => {
        if (typeof controls === 'undefined' && !forceShowControls) {
          setForceShowControls(true);
        }
      }}
      style={hover ? { cursor: 'pointer' } : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      <VisibilitySensor partialVisibility>
        {({ isVisible }: { isVisible: boolean }) => (
          <div css={[videoWrapperStyle, { marginBottom: getInitialMarginBottom(spaceAfter) }]}>
            <ReactPlayer
              url={isVisible ? url || `/static/videos/${file}` : undefined}
              className="react-player"
              width={PLAYER_WIDTH}
              height={PLAYER_HEIGHT}
              style={playerStyle}
              muted
              playing={isVisible}
              controls={typeof controls === 'undefined' ? forceShowControls : controls}
              playsinline
              loop={loop}
            />
            <div
              css={[
                videoWrapperStyle,
                dimmerStyle,
                {
                  opacity: isVisible ? 0 : 0.7,
                },
              ]}
            />
          </div>
        )}
      </VisibilitySensor>
    </div>
  );
};

const getInitialMarginBottom = (spaceAfter: VideoProps['spaceAfter']) => {
  if (typeof spaceAfter === 'undefined') {
    return 30;
  } else if (typeof spaceAfter === 'number') {
    return spaceAfter;
  } else if (spaceAfter) {
    return 50;
  }
  return 0;
};

const isYouTubeDomain = (url?: string) => {
  return url ? YOUTUBE_DOMAINS.some(domain => url.includes(domain)) : false;
};

const videoWrapperStyle = css({
  position: 'relative',
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  backgroundColor: '#000',
});

const playerStyle = css({
  outline: 'none',
  backgroundColor: '#000',
  borderRadius: borderRadius.md,
});

const dimmerStyle = css({
  pointerEvents: 'none',
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  transition: 'opacity 0.5s ease-out',

  [`@media screen and (max-width: ${breakpoints.medium + 124}px)`]: {
    display: 'none',
  },
});

export default Video;
