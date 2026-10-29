import type { VerticalBarEdgeIOS } from './types';

export function StatusBar() {
  return null;
}

StatusBar.setStyle = () => {};
StatusBar.setHidden = () => {};
StatusBar.getVerticalBarEdgeIOS = (): VerticalBarEdgeIOS | null => null;
StatusBar.setVerticalBarBehaviorIOS = () => {};

export function setStatusBarStyle() {}
export function setStatusBarHidden() {}
export function useVerticalBarEdgeIOS(): VerticalBarEdgeIOS | null {
  return null;
}
