import { Host, Text, VStack, HStack } from '@expo/ui/swift-ui';
import { frame } from '@expo/ui/swift-ui/modifiers';
import { ScrollView, StyleSheet, Text as RNText, View } from 'react-native';

export default function HostingRNViewsScreen() {
  return (
    <ScrollView>
      <Host style={{ height: 300 }}>
        <VStack spacing={20} modifiers={[frame({ height: 300 })]}>
          <HStack spacing={20}>
            <Text>H0V0</Text>
            <Text>H1V0</Text>
          </HStack>
          <HStack>
            <HStack spacing={20}>
              <Text>H0V1</Text>
              <Text>H1V1</Text>
            </HStack>
          </HStack>

          {/* NOTE: To host UIView inside SwiftUI, we may need fixed size */}
          <HStack modifiers={[frame({ width: 300, height: 100 })]}>
            <View style={[styles.uiView, { width: 300, height: 100 }]}>
              <RNText style={styles.uiViewText}>Text in UIView</RNText>
            </View>
          </HStack>
        </VStack>
      </Host>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  uiView: {
    backgroundColor: '#90EE90',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  uiViewText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

HostingRNViewsScreen.navigationOptions = {
  title: 'Hosting RN Views',
};
