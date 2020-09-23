interface Window {
  __NEXT_DATA__: any;
  NProgress: any;
  ExpoSnack: any;
  opera: any;

  __sidebarScroll: number;
  sidebarState: Record<string, boolean>;
}

declare module NodeJS {
  interface Global {
    tippy: any;
    __NEXT_DATA__: any;
  }
}
