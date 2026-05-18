import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import BouncyBox from './GestureHandler/BouncyBox';
import FancyButton from './GestureHandler/FancyButton';
import { BodyText } from '../components/BodyText';

export default function GestureHandlerListScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <BodyText style={styles.title}>LongPressGestureHandler, TapGestureHandler</BodyText>
      <BodyText color="secondary" style={styles.paragraph}>
        You can single tap, double tap, or long press these buttons!
      </BodyText>
      <FancyButton
        onSingleTap={() => alert('Single tap')}
        onDoubleTap={() => alert('Double tap')}
        onLongPress={() => alert('Long press')}>
        <BodyText>Try this button out!</BodyText>
      </FancyButton>

      <View style={{ marginTop: 20 }} />

      <FancyButton
        onSingleTap={() => alert('Single tap #2!')}
        onDoubleTap={() => alert('Double tap #2!')}
        onLongPress={() => alert('Long press #2!')}>
        <BodyText>A second fancy button!</BodyText>
      </FancyButton>

      <View style={{ marginTop: 10 }} />

      <BodyText style={styles.title}>PanGestureHandler, RotationGestureHandler</BodyText>
      <BodyText color="secondary" style={styles.paragraph}>
        You can drag it left and right, and also use two fingers to rotate it, and it'll bounce
        back!
      </BodyText>

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
    fontSize: 15,
    marginBottom: 20,
  },
});
