import { requireNativeView } from 'expo';

import { LabelProps } from '.';

const LabelNativeView: React.ComponentType<LabelProps> = requireNativeView('ExpoUI', 'LabelView');

/**
 * Renders a native label view, which could be used in a list or section.
 *
 * @param {LabelProps} props - The properties passed to the Label component.
 * @returns {JSX.Element} The rendered native Label component.
 * @platform ios
 */
export function Label(props: LabelProps) {
  return <LabelNativeView {...props} />;
}
