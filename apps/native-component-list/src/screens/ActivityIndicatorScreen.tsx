import * as React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import Colors from '../constants/Colors';
import { Page, Section } from '../components/Page';

function ActivityIndicatorStopping({ hidesWhenStopped }: { hidesWhenStopped?: boolean }) {
  const [animating, setAnimating] = React.useState(true);

  React.useEffect(() => {
    let _timer: any | undefined;
    const setToggleTimeout = () => {
      _timer = setTimeout(() => {
        setAnimating(v => !v);
        setToggleTimeout();
      }, 2000);
    };
    setToggleTimeout();
    return () => clearTimeout(_timer);
  }, []);

  return (
    <ActivityIndicator
      style={styles.item}
      size="large"
      animating={animating}
      hidesWhenStopped={hidesWhenStopped}
    />
  );
}

export default function ActivityIndicatorScreen() {
  return (
    <Page>
      <Section title="Custom Color" row>
        <ActivityIndicator style={styles.item} size="large" color={Colors.tintColor} />
        <ActivityIndicator style={styles.item} size="large" color={'red'} />
        <ActivityIndicator size="large" color={'blue'} />
      </Section>
      <Section title="hidesWhenStopped" row>
        <ActivityIndicatorStopping hidesWhenStopped={false} />
        <ActivityIndicatorStopping hidesWhenStopped />
      </Section>
      <Section title="Larger" row>
        <ActivityIndicator style={styles.item} size="small" />
        <ActivityIndicator size="large" />
      </Section>
    </Page>
  );
}

ActivityIndicatorScreen.navigationOptions = {
  title: 'ActivityIndicator',
};

const styles = StyleSheet.create({
  item: {
    marginRight: 8,
  },
});
