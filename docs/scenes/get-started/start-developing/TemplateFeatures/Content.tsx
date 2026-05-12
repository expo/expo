import { Button, useTheme } from '@expo/styleguide';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ReactNode, useEffect, useState } from 'react';

import { prefersDarkTheme } from '~/common/window';

type Props = {
  imgSrc: string;
  darkImgSrc?: string;
  alt: string;
  content: ReactNode;
  href?: string;
};

export function Content({ imgSrc, darkImgSrc, alt, href, content }: Props) {
  const { themeName } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(
    function didMount() {
      setIsDarkMode(themeName === 'dark' || (themeName === 'auto' && prefersDarkTheme()));
    },
    [themeName]
  );

  return (
    <div>
      <div className="bg-screen flex items-center justify-center">
        <picture className="relative">
          {isDarkMode && <source srcSet={darkImgSrc} type="image/png" />}
          <img src={imgSrc} alt={alt} className="size-[300px]" />
        </picture>
      </div>
      <div className="border-default bg-default flex flex-col items-start gap-3 border-t px-6 pb-6">
        <div>
          {content}
          {href && (
            <Button href={href} rightSlot={<ArrowRightIcon />} theme="secondary">
              Learn more
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
