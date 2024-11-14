import { useTheme } from '@expo/styleguide';

import { DotGrid } from './DotGrid';

type Props = {
  source: string;
  alt: string;
  darkSource?: string;
  disableSrcSet?: boolean;
};

export const Diagram = ({ source, darkSource, disableSrcSet, alt }: Props) => {
  const { themeName } = useTheme();
  const isDark = themeName === 'dark';

  if (!source.match(/\.png$/)) {
    return (
      <div className="relative m-auto my-6 max-w-[750px] overflow-hidden rounded-md border border-default bg-default">
        <DotGrid />
        <picture className="relative">
          {isDark && darkSource && <source srcSet={darkSource} />}
          <img src={source} alt={alt} />
        </picture>
      </div>
    );
  }

  return (
    <div className="relative m-auto my-6 max-w-[750px] overflow-hidden rounded-md border border-default bg-default">
      <DotGrid />
      <picture className="relative">
        {!isDark && !disableSrcSet && (
          <source srcSet={source.replace('.png', '.avif')} type="image/avif" />
        )}
        {darkSource && isDark && !disableSrcSet && (
          <source srcSet={darkSource.replace('.png', '.avif')} type="image/avif" />
        )}
        {!isDark && !disableSrcSet && (
          <source srcSet={source.replace('.png', '.webp')} type="image/webp" />
        )}
        {darkSource && isDark && !disableSrcSet && (
          <source srcSet={darkSource.replace('.png', '.webp')} type="image/webp" />
        )}
        {darkSource && isDark && <source srcSet={darkSource} />}
        <img src={source} alt={alt} />
      </picture>
    </div>
  );
};
