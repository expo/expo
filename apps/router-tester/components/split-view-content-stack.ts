import { useRootNavigationState } from 'expo-router';

type StateRoute = { name: string; state?: StateNode };
type StateNode = { index?: number; routes: readonly StateRoute[] };

// Names of the active screens in the `(content)` stack of the split view at the `layout` route,
// bottom first. Preloaded screens after `index` are left out. `router.canDismiss()` cannot tell
// this: it also counts the stacks above the split view.
export function useContentScreens(layout: string): string[] {
  let node: StateNode | undefined = useRootNavigationState();
  // Follow the focused route, so an older instance of `layout` lower in a stack is skipped.
  while (node?.index !== undefined) {
    const route: StateRoute | undefined = node.routes[node.index];
    if (route?.name === layout) {
      if (route.state?.index === undefined) {
        break;
      }
      const content = route.state.routes[route.state.index];
      const stack = content?.name === '(content)' ? content.state : undefined;
      if (stack?.index !== undefined) {
        return stack.routes.slice(0, stack.index + 1).map((screen) => screen.name);
      }
      break;
    }
    node = route?.state;
  }
  // Without state, the stack shows only its initial screen.
  return ['index'];
}
