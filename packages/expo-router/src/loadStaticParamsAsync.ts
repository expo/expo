import type { DynamicConvention, RouteNode } from './Route';

async function recurseAndFlattenNodes<
  T,
  TProps,
  TProcess extends (node: T, props: any) => Promise<T[]>
>(nodes: T[], props: TProps, func: TProcess): Promise<T[]> {
  const tarr = await Promise.all(nodes.map((node) => func(node, props)).flat());
  return tarr.filter(Boolean) as T[];
}

export async function loadStaticParamsAsync(route: RouteNode): Promise<RouteNode> {
  const processed = (
    await Promise.all(
      route.children.map((route) => loadStaticParamsRecursive(route, { parentParams: {} }))
    )
  ).flat();

  route.children = processed;
  return route;
}

function assertStaticParams(route: RouteNode, params: Record<string, string | string[]>) {
  const matches = route.dynamic!.every((dynamic) => {
    const value = params[dynamic.name];
    return value !== undefined && value !== null;
  });
  if (!matches) {
    throw new Error(
      `generateStaticParams() must return an array of params that match the dynamic route. Received ${JSON.stringify(
        params
      )}`
    );
  }

  const validateSingleParam = (
    dynamic: DynamicConvention,
    value: any,
    allowMultipleSegments?: boolean
  ) => {
    if (typeof value !== 'string') {
      throw new Error(
        `generateStaticParams() for route "${route.contextKey}" expected param "${
          dynamic.name
        }" to be of type string, instead found "${typeof value}" while parsing "${value}".`
      );
    }
    const parts = value.split('/').filter(Boolean);
    if (parts.length > 1 && !allowMultipleSegments) {
      throw new Error(
        `generateStaticParams() for route "${route.contextKey}" expected param "${dynamic.name}" to not contain "/" (multiple segments) while parsing "${value}".`
      );
    }
    if (parts.length === 0) {
      throw new Error(
        `generateStaticParams() for route "${route.contextKey}" expected param "${dynamic.name}" not to be empty while parsing "${value}".`
      );
    }
  };

  route.dynamic!.forEach((dynamic) => {
    const value = params[dynamic.name];
    if (dynamic.deep) {
      // TODO: We could split strings by `/` and use that too.
      if (!Array.isArray(value)) {
        validateSingleParam(dynamic, value, true);
      } else {
        validateSingleParam(dynamic, value.filter(Boolean).join('/'), true);
      }
    } else {
      validateSingleParam(dynamic, value);
    }
    return value !== undefined && value !== null;
  });
}

/** lodash.uniqBy */
function uniqBy<T>(array: T[], key: (item: T) => string): T[] {
  const seen: { [key: string]: boolean } = {};
  return array.filter((item) => {
    const k = key(item);
    if (seen[k]) {
      return false;
    }
    seen[k] = true;
    return true;
  });
}

async function loadStaticParamsRecursive(
  route: RouteNode,
  props: { parentParams: any }
): Promise<RouteNode[]> {
  if (!route?.dynamic && !route?.children?.length) {
    return [route];
  }

  const loaded = await route.loadRoute();

  let staticParams: Record<string, string | string[]>[] = [];

  if (loaded.generateStaticParams) {
    staticParams = await loaded.generateStaticParams({
      params: props.parentParams || {},
    });
    if (!Array.isArray(staticParams)) {
      throw new Error(
        `generateStaticParams() must return an array of params, received ${staticParams}`
      );
    }

    // Assert that at least one param from each matches the dynamic route.
    staticParams.forEach((params) => assertStaticParams(route, params));
  }

  route.children = uniqBy(
    (
      await recurseAndFlattenNodes(
        [...route.children],
        {
          ...props,
          parentParams: {
            ...props.parentParams,
            ...staticParams,
          },
        },
        loadStaticParamsRecursive
      )
    ).flat(),
    (i) => i.route
  );

  const createParsedRouteName = (input: string, params: any) => {
    let parsedRouteName = input;
    route.dynamic?.map((query) => {
      const param = params[query.name];
      const formattedParameter = Array.isArray(param) ? param.join('/') : param;
      if (query.deep) {
        parsedRouteName = parsedRouteName.replace(`[...${query.name}]`, formattedParameter);
      } else {
        parsedRouteName = parsedRouteName.replace(`[${query.name}]`, param);
      }
    });

    return parsedRouteName;
  };

  const generatedRoutes = await Promise.all(
    staticParams.map(async (params) => {
      const parsedRoute = createParsedRouteName(route.route, params);
      const generatedContextKey = createParsedRouteName(route.contextKey, params);

      return {
        ...route,
        // TODO: Add a new field for this
        contextKey: generatedContextKey,
        // Convert the dynamic route to a static route.
        dynamic: null,
        route: parsedRoute,
        children: uniqBy(
          (
            await recurseAndFlattenNodes(
              [...route.children],
              {
                ...props,
                parentParams: {
                  ...props.parentParams,
                  ...staticParams,
                },
              },
              loadStaticParamsRecursive
            )
          ).flat(),
          (i) => i.route
        ),
      };
    })
  );

  return [route, ...generatedRoutes];
}
