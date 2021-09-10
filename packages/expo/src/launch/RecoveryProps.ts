import { InitialProps } from './withExpoRoot.types';

export const attachRecoveredProps = <P extends InitialProps>(props: P): P => {
  try {
    // Optionally import expo-error-recovery
    const { recoveredProps } = require('expo-error-recovery');
    return {
      ...props,
      exp: { ...props.exp, errorRecovery: recoveredProps },
    };
  } catch {}

  return props;
};
