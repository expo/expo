/// <reference types="node" />

// Extend the NodeJS namespace
declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}

// Create types for CSS modules
declare module '*.module.css' {
  /** **Experimental:** Import styles that can be used with `react-native-web` components, using the `style` prop. */
  export const unstable_styles: { readonly [key: string]: object };

  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  /** **Experimental:** Import styles that can be used with `react-native-web` components, using the `style` prop. */
  export const unstable_styles: { readonly [key: string]: object };

  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  /** **Experimental:** Import styles that can be used with `react-native-web` components, using the `style` prop. */
  export const unstable_styles: { readonly [key: string]: object };

  const classes: { readonly [key: string]: string };
  export default classes;
}

// Allow for css imports, but don't export anything
declare module '*.css';
declare module '*.sass';
declare module '*.scss';
