import { requireNativeView } from 'expo';
import { NativeSyntheticEvent } from 'react-native';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

export type PopoverViewProps = {
  children: React.ReactNode;
  /**
   * Whether the popover is presented.
   */
  isPresented?: boolean;
  /**
   * A callback that is called when the `isPresented` state changes.
   */
  onIsPresentedChange?: (isPresented: boolean) => void;
  /**
   * The positioning anchor that defines the attachment point of the popover.
   */
  attachmentAnchor?: 'leading' | 'trailing' | 'center' | 'top' | 'bottom';
  /**
   * The edge of the `attachmentAnchor` that defines the location of the popover’s arrow. The default is `none`, which results in the system allowing any arrow edge.
   * @default 'none'
   */
  arrowEdge?: 'leading' | 'trailing' | 'top' | 'bottom' | 'none';
} & CommonViewModifierProps;

type NativePopoverViewProps = Omit<PopoverViewProps, 'onIsPresentedChange'> & {
  onIsPresentedChange?: (event: NativeSyntheticEvent<{ isPresented: boolean }>) => void;
};

const PopoverNativeView: React.ComponentType<NativePopoverViewProps> = requireNativeView(
  'ExpoUI',
  'PopoverView'
);

const PopoverViewContent: React.ComponentType<object> = requireNativeView(
  'ExpoUI',
  'PopoverViewContent'
);

const PopoverViewPopContent: React.ComponentType<object> = requireNativeView(
  'ExpoUI',
  'PopoverViewPopContent'
);

function PopoverTrigger(props: { children: React.ReactNode }) {
  return <PopoverViewContent {...props} />;
}

function PopoverContent(props: { children: React.ReactNode }) {
  return <PopoverViewPopContent {...props} />;
}

Popover.Trigger = PopoverTrigger;
Popover.Content = PopoverContent;

export function Popover(props: PopoverViewProps) {
  const { onIsPresentedChange, modifiers, children, isPresented, ...restProps } = props;

  const handleIsPresentedChange = (event: NativeSyntheticEvent<{ isPresented: boolean }>) => {
    onIsPresentedChange?.(event.nativeEvent.isPresented);
  };

  return (
    <PopoverNativeView
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}
      isPresented={isPresented}
      onIsPresentedChange={handleIsPresentedChange}>
      {children}
    </PopoverNativeView>
  );
}
