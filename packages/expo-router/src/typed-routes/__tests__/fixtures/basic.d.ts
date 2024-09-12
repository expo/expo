/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/(a)/folder` | `/(b)/folder` | `/(group)/(a)/folder` | `/(group)/(b)/folder` | `/(group)/folder` | `/(group)/static` | `/_sitemap` | `/apple` | `/banana` | `/folder` | `/static`;
      DynamicRoutes: `/(a)/folder/${Router.SingleRoutePart<T>}` | `/(a)/folder/${string}` | `/(b)/folder/${Router.SingleRoutePart<T>}` | `/(b)/folder/${string}` | `/(c)/folder/${Router.SingleRoutePart<T>}` | `/(group)/(a)/folder/${Router.SingleRoutePart<T>}` | `/(group)/(a)/folder/${string}` | `/(group)/(b)/folder/${Router.SingleRoutePart<T>}` | `/(group)/(b)/folder/${string}` | `/(group)/folder/${Router.SingleRoutePart<T>}` | `/(group)/folder/${string}` | `/animals/${string}` | `/colors/${Router.SingleRoutePart<T>}` | `/folder/${Router.SingleRoutePart<T>}` | `/folder/${string}` | `/mix/${Router.SingleRoutePart<T>}/${Router.SingleRoutePart<T>}/${string}`;
      DynamicRouteTemplate: `/(a)/folder/[...slug]` | `/(a)/folder/[slug]` | `/(b)/folder/[...slug]` | `/(b)/folder/[slug]` | `/(c)/folder/[slug]` | `/(group)/(a)/folder/[...slug]` | `/(group)/(a)/folder/[slug]` | `/(group)/(b)/folder/[...slug]` | `/(group)/(b)/folder/[slug]` | `/(group)/folder/[...slug]` | `/(group)/folder/[slug]` | `/animals/[...animal]` | `/colors/[color]` | `/folder/[...slug]` | `/folder/[slug]` | `/mix/[fruit]/[color]/[...animals]`;
    }
  }
}
