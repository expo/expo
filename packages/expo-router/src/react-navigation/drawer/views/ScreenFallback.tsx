import * as React from 'react';
import { type StyleProp, View, type ViewProps, type ViewStyle } from 'react-native';

import { ResourceSavingView } from '../../elements';

type Props = {
  visible: boolean;
  children: React.ReactNode;
  enabled: boolean;
  style?: StyleProp<ViewStyle>;
};

let Screens: typeof import('react-native-screens') | undefined;

try {
  Screens = require('react-native-screens');
} catch (e) {
  // Ignore
}

export const MaybeScreenContainer = ({
  enabled,
  ...rest
}: ViewProps & {
  enabled: boolean;
  hasTwoStates: boolean;
  children: React.ReactNode;
}) => {
  if (Screens?.screensEnabled?.()) {
    return <Screens.ScreenContainer enabled={enabled} {...rest} />;
  }

  return <View {...rest} />;
};

export function MaybeScreen({ visible, children, ...rest }: Props) {
  if (Screens?.screensEnabled?.()) {
    return (
      <Screens.Screen {...rest} activityState={visible ? 2 : 0} freezeOnBlur={false}>
        {children}
      </Screens.Screen>
    );
  }

  return (
    <ResourceSavingView visible={visible} {...rest}>
      {children}
    </ResourceSavingView>
  );
}
