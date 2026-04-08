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
type ReactNativeImageSourcePropType =
  import('react-native').ImageSourcePropType;

declare module '*.png' {
  const asset: ReactNativeImageSourcePropType;
  export default asset;
}

declare module '*.jpg' {
  const asset: ReactNativeImageSourcePropType;
  export default asset;
}

declare module '*.jpeg' {
  const asset: ReactNativeImageSourcePropType;
  export default asset;
}

declare module '*.webp' {
  const asset: ReactNativeImageSourcePropType;
  export default asset;
}

declare module '*.avif' {
  const asset: ReactNativeImageSourcePropType;
  export default asset;
}

declare module '*.gif' {
  const asset: ReactNativeImageSourcePropType;
  export default asset;
}

declare module '*.ico' {
  const asset: ReactNativeImageSourcePropType;
  export default asset;
}

declare module '*.bmp' {
  const asset: ReactNativeImageSourcePropType;
  export default asset;
}
