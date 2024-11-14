import { ImgHTMLAttributes, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import 'yet-another-react-lightbox/styles.css';

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

export function LightboxImage({ src, alt, ...rest }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        <img src={src} alt={alt} {...rest} />
      </button>
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src }]}
        styles={{ container: { backgroundColor: 'rgba(0, 0, 0, .8)' } }}
        controller={{
          aria: true,
          closeOnBackdropClick: true,
        }}
        carousel={{ finite: true }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
        plugins={[Zoom]}
      />
    </>
  );
}
