import { Button, useTheme } from '@expo/styleguide';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ReactNode, useEffect, useState } from 'react';

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
      const darkMode =
        themeName === 'dark' ||
        (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(darkMode);
    },
    [themeName]
  );

  return (
    <div>
      <div className="flex items-center justify-center bg-screen">
        <picture className="relative">
          {isDarkMode && <source srcSet={darkImgSrc} type="image/png" />}
          <img src={imgSrc} alt={alt} className="size-[300px]" />
        </picture>
      </div>
      <div className="flex flex-col items-start gap-3 border-t border-default bg-default px-6 pb-6">
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
