import { type ViewEvent } from '@expo/ui/jetpack-compose';
import { type ExpoModifier } from '@expo/ui/jetpack-compose/modifiers';
import { requireNativeView } from 'expo';
import { type Ref } from 'react';

export interface ComposeWebViewProps {
  /**
   * The URL to load in the web view.
   */
  url: string;

  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];

  /**
   * Imperative ref to the web view.
   */
  ref?: Ref<ComposeWebViewRef>;

  /**
   * Callback function that is called when the loading progress of the web view changes.
   */
  onLoadingProgressChanged?: (progress: number) => void;
}

export type ComposeWebViewRef = {
  loadUrl: (url: string) => Promise<void>;
  reload: () => Promise<void>;
};

const NativeView: React.ComponentType<NativeProps> = requireNativeView(
  'ComposeWebViewModule',
  'ComposeWebView'
);

type NativeProps = Omit<ComposeWebViewProps, 'onLoadingProgressChanged'> &
  ViewEvent<'onLoadingProgressChanged', { progress: number }>;

function transformProps(props: ComposeWebViewProps): NativeProps {
  return {
    ...props,
    onLoadingProgressChanged: (event) => {
      props.onLoadingProgressChanged?.(event.nativeEvent.progress);
    },
  };
}

export function ComposeWebView(props: ComposeWebViewProps) {
  return <NativeView {...transformProps(props)} />;
}
