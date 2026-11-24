// `react-dom` is an optional peer dependency and `@types/react-dom` is not a
// dependency of this package. Declare the one export the web bottom sheet uses.
declare module 'react-dom' {
  import type { ReactNode, ReactPortal } from 'react';

  export function createPortal(
    children: ReactNode,
    container: Element | DocumentFragment,
    key?: string | null
  ): ReactPortal;
}
