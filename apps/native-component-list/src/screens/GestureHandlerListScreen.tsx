import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import BouncyBox from './GestureHandler/BouncyBox';
import FancyButton from './GestureHandler/FancyButton';

export default function GestureHandlerListScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>LongPressGestureHandler, TapGestureHandler</Text>
      <Text style={styles.paragraph}>
        You can single tap, double tap, or long press these buttons!
      </Text>
      <FancyButton
        onSingleTap={() => alert('Single tap')}
        onDoubleTap={() => alert('Double tap')}
        onLongPress={() => alert('Long press')}>
        <Text>Try this button out!</Text>
      </FancyButton>

      <View style={{ marginTop: 20 }} />

      <FancyButton
        onSingleTap={() => alert('Single tap #2!')}
        onDoubleTap={() => alert('Double tap #2!')}
        onLongPress={() => alert('Long press #2!')}>
        <Text>A second fancy button!</Text>
      </FancyButton>

      <View style={{ marginTop: 10 }} />

      <Text style={styles.title}>PanGestureHandler, RotationGestureHandler</Text>
      <Text style={styles.paragraph}>
        You can drag it left and right, and also use two fingers to rotate it, and it'll bounce
        back!
      </Text>

      <BouncyBox />
      <View style={{ marginTop: 20 }} />
      <BouncyBox style={{ backgroundColor: 'orange' }} />
      <View style={{ marginTop: 20 }} />
    </ScrollView>
  );
}

GestureHandlerListScreen.navigationOptions = {
  title: 'Gesture Handler List',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  title: {
    marginTop: 15,
    fontSize: Dimensions.get('window').width < 375 ? 20 : 25,
    marginBottom: 5,
  },
  paragraph: {
    color: '#888',
    fontSize: 15,
    marginBottom: 20,
  },
});
