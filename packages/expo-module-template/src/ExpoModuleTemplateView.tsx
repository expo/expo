import * as React from 'react';

import NativeView from './ExpoModuleTemplateNativeView';

export interface ExpoModuleTemplateViewProps {
  greatProp: string;
}

interface ExpoModuleTemplateViewState {}

/**
 * Great view that would suit your needs!
 *
 * @example
 * ```tsx
 * <ExpoModuleTemplateNativeView
 *   greatProp="great"
 * />
 * ```
 */
export default class ExpoModuleTemplateView extends React.Component<
  ExpoModuleTemplateViewProps,
  ExpoModuleTemplateViewState
> {
  render() {
    return <NativeView />;
  }
}
