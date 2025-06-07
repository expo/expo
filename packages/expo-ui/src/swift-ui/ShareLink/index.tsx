import { requireNativeView } from 'expo';
import { StyleProp, ViewStyle } from 'react-native';

import { Host } from '../Host';

export type ShareLinkProps = {
  /**
   * The URL or item to be shared.
   * This can be a web URL, a file path, or any other shareable item.
   */
  item: string;
  /**
   * Optional subject for the share action.
   * This is typically used as the title of the shared content.
   */
  subject?: string;
  /**
   * Optional message for the share action.
   * This is typically used as a description or additional information about the shared content.
   */
  message?: string;
  /**
   * Optional preview for the share action.
   * This can include a title and an image to be displayed in the share dialog.
   */
  preview?: { title: string; image: string };
  /**
   * Optional children to be rendered inside the share link.
   */
  children?: React.ReactNode;
};

const ShareLinkNativeView: React.ComponentType<ShareLinkProps> = requireNativeView(
  'ExpoUI',
  'ShareLinkView'
);

/**
 * `<ShareLink>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ShareLinkPrimitive(props: ShareLinkProps) {
  return <ShareLinkNativeView {...props} />;
}

/**
 * Renders the native ShareLink component with the provided properties.
 *
 * @param {ShareLinkProps} props - The properties passed to the ShareLink component.
 * @returns {JSX.Element} The rendered native ShareLink component.
 * @platform ios
 */
export function ShareLink(props: ShareLinkProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Host style={props.style} matchContents>
      <ShareLinkPrimitive {...props} />
    </Host>
  );
}
