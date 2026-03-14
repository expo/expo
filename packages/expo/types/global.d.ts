/* eslint-disable */

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

// Allow for image asset imports
declare module '*.png' {
  const path: string;
  export default path;
}

declare module '*.jpg' {
  const path: string;
  export default path;
}

declare module '*.jpeg' {
  const path: string;
  export default path;
}

declare module '*.webp' {
  const path: string;
  export default path;
}

declare module '*.avif' {
  const path: string;
  export default path;
}

declare module '*.gif' {
  const path: string;
  export default path;
}

declare module '*.ico' {
  const path: string;
  export default path;
}

declare module '*.bmp' {
  const path: string;
  export default path;
}

declare module '*.svg' {
  const path: string;
  export default path;
}
