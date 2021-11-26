import * as React from 'react';
export interface ExpoModuleTemplateViewProps {
    someGreatProp: number;
}
interface ExpoModuleTemplateViewState {
}
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
export default class ExpoModuleTemplateView extends React.Component<ExpoModuleTemplateViewProps, ExpoModuleTemplateViewState> {
    render(): JSX.Element;
}
export {};
