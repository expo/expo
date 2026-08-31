import { mergeClasses } from '@expo/styleguide';

import { DotGrid } from './DotGrid';

type Props = {
  source: string;
  alt: string;
  darkSource?: string;
  disableSrcSet?: boolean;
};

type PictureProps = {
  src: string;
  alt: string;
  withFormats: boolean;
  isPaired: boolean;
  className: string;
};

function DiagramPicture({ src, alt, withFormats, isPaired, className }: PictureProps) {
  return (
    <picture className={className}>
      {withFormats && <source srcSet={src.replace('.png', '.avif')} type="image/avif" />}
      {withFormats && <source srcSet={src.replace('.png', '.webp')} type="image/webp" />}
      <img
        src={src}
        alt={alt}
        loading={isPaired ? 'lazy' : undefined}
        decoding={isPaired ? 'async' : undefined}
      />
    </picture>
  );
}

export const Diagram = ({ source, darkSource, disableSrcSet, alt }: Props) => {
  const withFormats = source.endsWith('.png') && !disableSrcSet;

  return (
    <div className="relative m-auto my-6 max-w-187.5 overflow-hidden rounded-md border border-default bg-default">
      <DotGrid />
      <DiagramPicture
        src={source}
        alt={alt}
        withFormats={withFormats}
        isPaired={!!darkSource}
        className={mergeClasses('relative', darkSource && 'dark:hidden')}
      />
      {darkSource && (
        <DiagramPicture
          src={darkSource}
          alt={alt}
          withFormats={withFormats}
          isPaired
          className="relative light:hidden"
        />
      )}
    </div>
  );
};
