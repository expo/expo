import { Button, mergeClasses } from '@expo/styleguide';
import { ArrowRightIcon } from '@expo/styleguide-icons/outline/ArrowRightIcon';
import { ReactNode } from 'react';

type Props = {
  imgSrc: string;
  darkImgSrc?: string;
  alt: string;
  content: ReactNode;
  href?: string;
};

export function Content({ imgSrc, darkImgSrc, alt, href, content }: Props) {
  return (
    <div>
      <div className="flex items-center justify-center bg-screen">
        <picture className={mergeClasses('relative', darkImgSrc && 'dark:hidden')}>
          <img
            src={imgSrc}
            alt={alt}
            loading={darkImgSrc ? 'lazy' : undefined}
            decoding={darkImgSrc ? 'async' : undefined}
            className="size-75"
          />
        </picture>
        {darkImgSrc && (
          <picture className="relative light:hidden">
            <img src={darkImgSrc} alt={alt} loading="lazy" decoding="async" className="size-75" />
          </picture>
        )}
      </div>
      <div className="flex flex-col items-start gap-3 border-t border-default bg-default px-6 pb-6">
        <div>
          {content}
          {href && (
            <Button href={href} rightSlot={<ArrowRightIcon aria-hidden="true" />} theme="secondary">
              Learn more
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
