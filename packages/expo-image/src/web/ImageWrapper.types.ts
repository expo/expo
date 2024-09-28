import { CSSProperties, SyntheticEvent } from 'react';

import { SrcSetSource } from './useSourceSelection';
import { ImageContentPositionObject, ImageProps, ImageSource } from '../Image.types';

export type OnErrorEvent =
  | (({ source }: { source: ImageSource | null }) => void)
  | undefined
  | null;
export type OnLoadEvent =
  | ((event: SyntheticEvent<HTMLImageElement, Event>) => void)
  | undefined
  | null;
export type OnTransitionEndEvent = (() => void) | undefined | null;
export type OnMountEvent = (() => void) | undefined | null;
export type OnDisplayEvent = (() => void) | undefined | null;

export type ImageWrapperEvents = {
  onLoad?: OnLoadEvent[];
  onError?: OnErrorEvent[];
  onTransitionEnd?: OnTransitionEndEvent[];
  onMount?: OnMountEvent[];
  onDisplay?: OnDisplayEvent[];
};

export type ImageWrapperProps = {
  source?: ImageSource | SrcSetSource | null;
  events?: ImageWrapperEvents;
  contentPosition?: ImageContentPositionObject;
  hashPlaceholderContentPosition?: ImageContentPositionObject;
  priority?: string | null;
  style: CSSProperties;
  tintColor?: string | null;
  hashPlaceholderStyle?: CSSProperties;
  className?: string;
  accessibilityLabel?: string;
  cachePolicy?: ImageProps['cachePolicy'];
};
