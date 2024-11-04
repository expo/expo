/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      // @ts-ignore-error -- During tests we need to ignore the "duplicate" declaration error, as multiple fixture declare types 
      hrefParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(group)' | ''}/static` | `/static`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(group)' | ''}${'/(a)' | '/(b)' | ''}/folder` | `/folder`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(group)' | ''}${'/(a)' | '/(b)' | ''}/folder/[slug]` | `/folder/[slug]`, params: Router.UnknownOutputParams & { slug: string | number; } } | { pathname: `${'/(group)' | ''}${'/(a)' | '/(b)' | ''}/folder/[...slug]` | `/folder/[...slug]`, params: Router.UnknownOutputParams & { slug: (string | number)[]; } };
      // @ts-ignore-error -- During tests we need to ignore the "duplicate" declaration error, as multiple fixture declare types 
      href: Router.RelativePathString | Router.ExternalPathString | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(group)' | ''}/static${`?${string}` | `#${string}` | ''}` | `/static${`?${string}` | `#${string}` | ''}` | `${'/(group)' | ''}${'/(a)' | '/(b)' | ''}/folder${`?${string}` | `#${string}` | ''}` | `/folder${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(group)' | ''}/static` | `/static`; params?: Router.UnknownInputParams; } | { pathname: `${'/(group)' | ''}${'/(a)' | '/(b)' | ''}/folder` | `/folder`; params?: Router.UnknownInputParams; } | `${'/(group)' | ''}${'/(a)' | '/(b)' | ''}/folder/${Router.SingleRoutePart<T>}` | `/folder/${Router.SingleRoutePart<T>}` | `${'/(group)' | ''}${'/(a)' | '/(b)' | ''}/folder/${string}` | `/folder/${string}` | { pathname: `${'/(group)' | ''}${'/(a)' | '/(b)' | ''}/folder/[slug]` | `/folder/[slug]`, params: Router.UnknownInputParams & { slug: string | number; } } | { pathname: `${'/(group)' | ''}${'/(a)' | '/(b)' | ''}/folder/[...slug]` | `/folder/[...slug]`, params: Router.UnknownInputParams & { slug: (string | number)[]; } };
    }
  }
}
