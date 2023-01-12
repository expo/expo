import { css } from '@emotion/react';
import { spacing, theme } from '@expo/styleguide';

type IconProps = {
  title: string;
  image?: string;
  size?: number;
};

export const Icon = ({ title, image, size = 64 }: IconProps) => (
  <img
    css={[
      iconStyle,
      css({
        width: size,
        height: size,
      }),
    ]}
    alt={title}
    src={image}
  />
);

const iconStyle = css({
  background: theme.background.element,
  borderRadius: '100%',
  padding: spacing[1],
});
