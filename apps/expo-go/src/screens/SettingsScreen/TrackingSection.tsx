import { Spacer, Text, View } from 'expo-dev-client-components';
import * as Tracking from 'expo-tracking-transparency';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { SectionHeader } from '../../components/SectionHeader';

export function TrackingSection() {
  const [showTrackingItem, setShowTrackingItem] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const { status } = await Tracking.getTrackingPermissionsAsync();
      setShowTrackingItem(status === 'undetermined');
    })();
  }, [showTrackingItem]);

  if (!showTrackingItem) {
    return null;
  }

  return (
    <>
      <View>
        <SectionHeader header="Tracking" />

        <View bg="default" overflow="hidden" rounded="large" border="default">
          <TouchableOpacity
            onPress={async () => {
              const { status } = await Tracking.requestTrackingPermissionsAsync();
              setShowTrackingItem(status === 'undetermined');
            }}>
            <View padding="medium" bg="default">
              <Text size="medium" type="InterRegular">
                Allow access to app-related data for tracking
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLearnMorePress}>
          <View py="small" px="medium">
            <Text size="small" color="link" type="InterRegular">
              Learn more about what data Expo collects and why.
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Spacer.Vertical size="medium" />
    </>
  );
}

function handleLearnMorePress() {
  WebBrowser.openBrowserAsync('https://expo.io/privacy-explained');
}
