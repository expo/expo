import { Lightbox } from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

type Props = {
  src: string;
  open: boolean;
  close: () => void;
};

export default function LightboxModal({ src, open, close }: Props) {
  return (
    <Lightbox
      open={open}
      close={close}
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
  );
}
