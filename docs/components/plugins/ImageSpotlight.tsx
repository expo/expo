import { mergeClasses } from '@expo/styleguide';
import { type CSSProperties } from 'react';

import { LightboxImage } from '~/ui/components/LightboxImage';

type Props = {
  alt: string;
  style?: CSSProperties;
  containerClassName?: string;
  src: string;
  caption?: string;
};

export default function ImageSpotlight({ alt, src, style, containerClassName, caption }: Props) {
  return (
    <figure className={mergeClasses('text-center bg-subtle py-2.5 my-5', containerClassName)}>
      <LightboxImage src={src} alt={alt} style={style} className="inline" />
      {caption && (
        <figcaption className="mt-[14px] text-secondary text-center text-xs px-8 py-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
