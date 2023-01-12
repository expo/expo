import { css, keyframes } from '@emotion/react';
import { theme } from '@expo/styleguide';

type Props = { isLoading?: boolean };

export const BarLoader = ({ isLoading }: Props) => (
  <div css={[loaderStyle, isLoading && animationStyle]} />
);

const lineAnimation = keyframes({
  '0%': { width: '0%' },
  '80%': { width: '100%', opacity: 1 },
  '100%': { width: '100%', opacity: 0 },
});

const loaderStyle = css({
  background: theme.text.link,
  height: '2px',
  position: 'absolute',
  marginTop: 11,
  left: 1,
});

const animationStyle = css({
  animation: `${lineAnimation} 2000ms infinite ease-in-out`,
});
