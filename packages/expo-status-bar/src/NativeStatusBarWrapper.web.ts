import type {
  StatusBarAnimation,
  StatusBarProps,
  StatusBarStyle,
  VerticalBarBehaviorIOS,
  VerticalBarEdgeIOS,
} from './types';

export function StatusBar(props: StatusBarProps) {
  return null;
}

StatusBar.setStyle = (style: StatusBarStyle, animated?: boolean): void => {};
StatusBar.setHidden = (hidden: boolean, animation?: StatusBarAnimation): void => {};
StatusBar.getVerticalBarEdgeIOS = (): VerticalBarEdgeIOS | null => null;
StatusBar.setVerticalBarBehaviorIOS = (behavior: VerticalBarBehaviorIOS): void => {};

export function setStatusBarStyle(style: StatusBarStyle, animated?: boolean) {}
export function setStatusBarHidden(hidden: boolean, animation?: StatusBarAnimation) {}
export function useVerticalBarEdgeIOS(): VerticalBarEdgeIOS | null {
  return null;
}
