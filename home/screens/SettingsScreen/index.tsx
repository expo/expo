import { Spacer, View } from 'expo-dev-client-components';
import * as Tracking from 'expo-tracking-transparency';
import { useHome_CurrentUserQuery } from 'graphql/types';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { ConstantsSection } from './ConstantsSection';
import { DeleteAccount } from './DeleteAccountSection';
import { DevMenuGestureSection } from './DevMenuGestureSection';
import { ThemeSection } from './ThemeSection';
import { TrackingSection } from './TrackingSection';

export function SettingsScreen() {
  const { data } = useHome_CurrentUserQuery();

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag">
      <View flex="1" padding="medium">
        <ThemeSection />
        <Spacer.Vertical size="medium" />
        {Platform.OS === 'ios' && (
          <>
            <DevMenuGestureSection />
            <Spacer.Vertical size="medium" />
          </>
        )}
        {Tracking.isAvailable() && (
          <>
            <TrackingSection />
            <Spacer.Vertical size="medium" />
          </>
        )}
        <ConstantsSection />
        {data?.viewer ? (
          <>
            <Spacer.Vertical size="medium" />
            <DeleteAccount viewerUsername={data.viewer.username} />
          </>
        ) : null}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
