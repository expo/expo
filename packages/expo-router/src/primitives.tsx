import { createNavigatorFactory } from '@react-navigation/native';

// `@react-navigation/native` does not expose the Screen or Group components directly, so we have to
// do this hack.
export const { Screen, Group } = createNavigatorFactory({} as any)();
