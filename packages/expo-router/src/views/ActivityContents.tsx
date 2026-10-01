'use client';
import { Activity, type ActivityProps } from 'react';
import { NativeComponentRegistry, type ViewProps } from 'react-native';

let NativeActivityContents: ReturnType<typeof NativeComponentRegistry.get<ViewProps>> | undefined;

// Resolved on first render rather than at module scope: this module can be
// evaluated before React Native has finished initialising, and reading
// `NativeComponentRegistry` then throws "Cannot read property 'get' of undefined".
function getNativeActivityContents() {
  NativeActivityContents ??= NativeComponentRegistry.get<ViewProps>(
    'ExpoRouterActivityContents',
    () => ({
      uiViewClassName: 'RCTView',
      validAttributes: {
        style: {
          // @ts-expect-error: React Native's index signature rejects its special nested style config.
          display: {
            process: () => 'contents',
          },
        },
      },
    })
  );
  return NativeActivityContents;
}

export function ActivityContents({ mode, children }: ActivityProps) {
  const NativeContents = getNativeActivityContents();
  return (
    <Activity mode={mode}>
      <NativeContents style={{ display: 'contents' }}>{children}</NativeContents>
    </Activity>
  );
}
