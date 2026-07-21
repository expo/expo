import dynamic from 'next/dynamic';
import { ImgHTMLAttributes, useState } from 'react';

// Loaded on first click so the lightbox JS and its stylesheet stay out of the
// render-blocking path; the inline image below is independent of it.
const LightboxModal = dynamic(() => import('./LightboxModal'), { ssr: false });

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

export function LightboxImage({ src, alt, ...rest }: Props) {
  const [open, setOpen] = useState(false);
  const [lightboxRequested, setLightboxRequested] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLightboxRequested(true);
          setOpen(true);
        }}>
        <img src={src} alt={alt} {...rest} />
      </button>
      {lightboxRequested && (
        <LightboxModal
          src={src}
          open={open}
          close={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
