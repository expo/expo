import { mergeClasses } from '@expo/styleguide';
import dynamic from 'next/dynamic';
import { ImgHTMLAttributes, useState } from 'react';

import { isDarkTheme } from '~/common/window';

// Loaded on first click so the lightbox JS and its stylesheet stay out of the
// render-blocking path; the inline image below is independent of it.
const LightboxModal = dynamic(() => import('./LightboxModal'), { ssr: false });

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  darkSrc?: string;
};

export function LightboxImage({ src, darkSrc, alt, className, ...rest }: Props) {
  const [open, setOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string>();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLightboxSrc(darkSrc && isDarkTheme() ? darkSrc : src);
          setOpen(true);
        }}>
        {darkSrc ? (
          <>
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              className={mergeClasses(className, 'dark:hidden')}
              {...rest}
            />
            <img
              src={darkSrc}
              alt={alt}
              loading="lazy"
              decoding="async"
              className={mergeClasses(className, 'light:hidden')}
              {...rest}
            />
          </>
        ) : (
          <img src={src} alt={alt} className={className} {...rest} />
        )}
      </button>
      {lightboxSrc && (
        <LightboxModal
          src={lightboxSrc}
          open={open}
          close={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
