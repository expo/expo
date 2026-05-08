import { useTheme } from '@expo/styleguide';
import { useEffect, useState } from 'react';

import { prefersDarkTheme } from '~/common/window';

import { DotGrid } from './DotGrid';

type Props = {
  source: string;
  alt: string;
  darkSource?: string;
  mode: 'landscape' | 'portrait';
};

const ASPECT_CLASS = {
  landscape: 'aspect-[3/2] w-[540px]',
  portrait: 'aspect-[9/16] w-[220px]',
} as const;

export const ComponentDiagram = ({ source, darkSource, alt, mode }: Props) => {
  const { themeName } = useTheme();
  const [isDark, setDark] = useState(themeName === 'dark');

  useEffect(() => {
    if (themeName === 'auto') {
      setDark(prefersDarkTheme());
    } else {
      setDark(themeName === 'dark');
    }
  }, [themeName]);

  return (
    <div
      className={`border-default bg-default relative mx-auto my-6 max-w-full overflow-hidden rounded-md border ${ASPECT_CLASS[mode]}`}>
      <DotGrid />
      <picture className="relative block size-full">
        {isDark && darkSource && <source srcSet={darkSource} />}
        <img src={source} alt={alt} className="size-full object-cover" />
      </picture>
    </div>
  );
};
