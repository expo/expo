import { useGlobalSearchParams } from './hooks';
import { Redirect } from './link/Link';
import { matchDeepDynamicRouteName, matchDynamicName } from './matchers';

export function getRedirectModule(route: string) {
  return {
    default: function RedirectComponent() {
      const params = useGlobalSearchParams();

      // Replace dynamic parts of the route with the actual values from the params
      let href = route
        .split('/')
        .map((part) => {
          const match = matchDynamicName(part) || matchDeepDynamicRouteName(part);
          if (!match) {
            return part;
          }

          const param = params[match];
          delete params[match];
          return param;
        })
        .filter(Boolean)
        .join('/');

      // Add any remaining params as query string
      const queryString = new URLSearchParams(params as Record<string, any>).toString();

      if (queryString) {
        href += `?${queryString}`;
      }

      return <Redirect href={href} />;
    },
  };
}
