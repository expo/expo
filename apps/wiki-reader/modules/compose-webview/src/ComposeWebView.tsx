import { ExpoModifier } from '@expo/ui/jetpack-compose/modifiers';
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
}

export type ComposeWebViewRef = {
  loadUrl: (url: string) => Promise<void>;
  reload: () => Promise<void>;
};

const NativeView: React.ComponentType<ComposeWebViewProps> = requireNativeView(
  'ComposeWebViewModule',
  'ComposeWebView'
);

type NativeProps = ComposeWebViewProps;

function transformProps(props: ComposeWebViewProps): NativeProps {
  return {
    ...props,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
  };
}

export function ComposeWebView(props: ComposeWebViewProps) {
  return <NativeView {...transformProps(props)} />;
}
