interface Window {
  __NEXT_DATA__: any;
  NProgress: any;
  ExpoSnack: any;
  opera: string;

  __sidebarScroll: number;
  sidebarState: Record<string, boolean>;
}

declare module NodeJS {
  interface Global {
    tippy: any;
    __NEXT_DATA__: any;
  }
}

// Module declarations for non-typed libraries or types not exposed;
declare module 'react-diff-view';
declare module 'react-player/lib/players/FilePlayer';
