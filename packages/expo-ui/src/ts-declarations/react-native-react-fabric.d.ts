declare module 'react-native/Libraries/Renderer/shims/ReactFabric' {
  import type * as React from 'react';

  /**
   * React's Fabric renderer. This is the same entry point `AppRegistry` renders
   * surfaces through, but it is not part of React Native's public API, so its
   * types are declared here.
   */
  const ReactFabric: {
    /**
     * Renders an element into the Fabric surface with the given root tag.
     * Passing `false` for `concurrentRoot` selects the legacy synchronous root,
     * which finishes the work before returning instead of yielding.
     */
    render(
      element: React.ReactElement,
      containerTag: number,
      callback?: (() => void) | null,
      concurrentRoot?: boolean | null,
      options?: unknown
    ): unknown;
    unmountComponentAtNode(containerTag: number): void;
  };

  export default ReactFabric;
}
