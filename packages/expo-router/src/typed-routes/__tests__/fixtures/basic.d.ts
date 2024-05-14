import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> {
      StaticRoutes:
        | `/(a)/folder`
        | `/(b)/folder`
        | `/(group)/(a)/folder`
        | `/(group)/(b)/folder`
        | `/(group)/folder`
        | `/(group)/static`
        | `/_sitemap`
        | `/apple`
        | `/banana`
        | `/folder`
        | `/static`;
      DynamicRoutes:
        | `/(a)/folder/${Router.SingleRoutePart<T>}`
        | `/(b)/folder/${Router.SingleRoutePart<T>}`
        | `/(c)/folder/${Router.SingleRoutePart<T>}`
        | `/(group)/(a)/folder/${Router.SingleRoutePart<T>}`
        | `/(group)/(b)/folder/${Router.SingleRoutePart<T>}`
        | `/(group)/folder/${Router.SingleRoutePart<T>}`
        | `/animals/${Router.SingleRoutePart<T>}`
        | `/colors/${Router.SingleRoutePart<T>}`
        | `/folder/${Router.SingleRoutePart<T>}`
        | `/mix/${Router.SingleRoutePart<T>}/${Router.SingleRoutePart<T>}/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate:
        | `/(a)/folder/[...slug]`
        | `/(a)/folder/[slug]`
        | `/(b)/folder/[...slug]`
        | `/(b)/folder/[slug]`
        | `/(c)/folder/[slug]`
        | `/(group)/(a)/folder/[...slug]`
        | `/(group)/(a)/folder/[slug]`
        | `/(group)/(b)/folder/[...slug]`
        | `/(group)/(b)/folder/[slug]`
        | `/(group)/folder/[...slug]`
        | `/(group)/folder/[slug]`
        | `/animals/[...animal]`
        | `/colors/[color]`
        | `/folder/[...slug]`
        | `/folder/[slug]`
        | `/mix/[fruit]/[color]/[...animals]`;
    }
  }
}
