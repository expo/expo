import { ImageWrapperEvents } from './ImageWrapper.types';
import { ImageSource } from '../Image.types';

export function getImageWrapperEventHandler(
  events: ImageWrapperEvents | undefined,
  source: ImageSource
) {
  return {
    onLoad: (event) => {
      if (typeof window !== 'undefined') {
        // this ensures the animation will run, since the starting class is applied at least 1 frame before the target class set in the onLoad event callback
        window.requestAnimationFrame(() => {
          events?.onLoad?.forEach((e) => e?.(event));
        });
      } else {
        events?.onLoad?.forEach((e) => e?.(event));
      }
    },
    onTransitionEnd: () => events?.onTransitionEnd?.forEach((e) => e?.()),
    onError: () => events?.onError?.forEach((e) => e?.({ source: source || null })),
  };
}
