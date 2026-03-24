import type { NavigationState, PartialState, Route } from './types';

type ResetState =
  | PartialState<NavigationState>
  | NavigationState
  | (Omit<NavigationState, 'routes'> & {
      routes: Omit<Route<string>, 'key'>[];
    });

type GoBackAction = {
  type: 'GO_BACK';
  source?: string;
  target?: string;
};

type NavigateAction = {
  type: 'NAVIGATE';
  payload: {
    name: string;
    params?: object;
    path?: string;
    merge?: boolean;
    pop?: boolean;
  };
  source?: string;
  target?: string;
};

type NavigateDeprecatedAction = {
  type: 'NAVIGATE_DEPRECATED';
  payload: {
    name: string;
    params?: object;
    merge?: boolean;
  };
  source?: string;
  target?: string;
};

type ResetAction = {
  type: 'RESET';
  payload: ResetState | undefined;
  source?: string;
  target?: string;
};

type SetParamsAction = {
  type: 'SET_PARAMS';
  payload: { params?: object };
  source?: string;
  target?: string;
};

type ReplaceParamsAction = {
  type: 'REPLACE_PARAMS';
  payload: { params?: object };
  source?: string;
  target?: string;
};

type PreloadAction = {
  type: 'PRELOAD';
  payload: {
    name: string;
    params?: object;
  };
  source?: string;
  target?: string;
};

export type Action =
  | GoBackAction
  | NavigateAction
  | NavigateDeprecatedAction
  | ResetAction
  | SetParamsAction
  | ReplaceParamsAction
  | PreloadAction;

export function goBack(): Action {
  return { type: 'GO_BACK' };
}

export function navigate(
  name: string,
  params?: object,
  options?: {
    merge?: boolean;
    pop?: boolean;
  }
): Action;

export function navigate(options: {
  name: string;
  params?: object;
  path?: string;
  merge?: boolean;
  pop?: boolean;
}): Action;

export function navigate(...args: any): Action {
  if (typeof args[0] === 'string') {
    const [name, params, options] = args;

    if (typeof options === 'boolean') {
      console.warn(
        `Passing a boolean as the third argument to 'navigate' is deprecated. Pass '{ merge: true }' instead.`
      );
    }

    return {
      type: 'NAVIGATE',
      payload: {
        name,
        params,
        merge: typeof options === 'boolean' ? options : options?.merge,
        pop: options?.pop,
      },
    };
  } else {
    const payload = args[0] || {};

    if (!('name' in payload)) {
      throw new Error(
        'You need to specify a name when calling navigate with an object as the argument. See https://reactnavigation.org/docs/navigation-actions#navigate for usage.'
      );
    }

    return { type: 'NAVIGATE', payload };
  }
}

export function navigateDeprecated(
  ...args:
    | [name: string]
    | [name: string, params: object | undefined]
    | [options: { name: string; params?: object }]
): Action {
  if (typeof args[0] === 'string') {
    return {
      type: 'NAVIGATE_DEPRECATED',
      payload: { name: args[0], params: args[1] },
    };
  } else {
    const payload = args[0] || {};

    if (!('name' in payload)) {
      throw new Error(
        'You need to specify a name when calling navigateDeprecated with an object as the argument. See https://reactnavigation.org/docs/navigation-actions#navigatelegacy for usage.'
      );
    }

    return { type: 'NAVIGATE_DEPRECATED', payload };
  }
}

export function reset(state: ResetState | undefined) {
  return { type: 'RESET', payload: state } as const satisfies ResetAction;
}

export function setParams(params: object) {
  return {
    type: 'SET_PARAMS',
    payload: { params },
  } as const satisfies SetParamsAction;
}

export function replaceParams(params: object) {
  return {
    type: 'REPLACE_PARAMS',
    payload: { params },
  } as const satisfies ReplaceParamsAction;
}

export function preload(name: string, params?: object) {
  return {
    type: 'PRELOAD',
    payload: { name, params },
  } as const satisfies PreloadAction;
}
