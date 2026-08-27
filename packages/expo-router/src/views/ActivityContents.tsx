'use client';
import { Activity, type ActivityProps } from 'react';
import { NativeComponentRegistry, type ViewProps } from 'react-native';

const NativeActivityContents = NativeComponentRegistry.get<ViewProps>(
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

export function ActivityContents({ mode, children }: ActivityProps) {
  return (
    <Activity mode={mode}>
      <NativeActivityContents style={{ display: 'contents' }}>{children}</NativeActivityContents>
    </Activity>
  );
}
