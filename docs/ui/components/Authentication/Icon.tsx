import { css } from '@emotion/react';

type IconProps = {
  title: string;
  image?: string;
  size?: number;
};

export const Icon = ({ title, image, size = 64 }: IconProps) => (
  <img
    className="rounded-full p-1 bg-element"
    css={css({
      width: size,
      height: size,
    })}
    alt={title}
    src={image}
  />
);
