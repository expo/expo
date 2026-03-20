import { ConfigPlugin } from 'expo/config-plugins';
export type FileSystemProps = {
    /**
     * Whether to enable `LSSupportsOpeningDocumentsInPlace`, allowing the app to open documents in place.
     * @platform ios
     */
    supportsOpeningDocumentsInPlace?: boolean;
    /**
     * Whether to enable `UIFileSharingEnabled`, making the app's Documents directory accessible through the Files app.
     * @platform ios
     */
    enableFileSharing?: boolean;
};
declare const _default: ConfigPlugin<FileSystemProps>;
export default _default;
