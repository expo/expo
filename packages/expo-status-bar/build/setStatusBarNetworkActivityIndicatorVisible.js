import { StatusBar } from 'react-native';
// @needsAudit
/**
 * Toggle visibility of the network activity indicator.
 * @param visible If the network activity indicator should be visible.
 * @platform ios
 */
export default function setStatusBarNetworkActivityIndicatorVisible(visible) {
    StatusBar.setNetworkActivityIndicatorVisible(visible);
}
//# sourceMappingURL=setStatusBarNetworkActivityIndicatorVisible.js.map