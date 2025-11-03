import { ConfigPlugin } from 'expo/config-plugins';
type Props = {
    /** Disable linking the included libdav1d decoder. Useful when another dependency already provides it. */
    disableLibdav1d?: boolean;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
