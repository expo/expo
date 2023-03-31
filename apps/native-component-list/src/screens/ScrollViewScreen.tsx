import { H3 } from '@expo/html-elements';
import * as React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  RefreshControl,
} from 'react-native';

import Button from '../components/Button';
import TitleSwitch from '../components/TitledSwitch';

export default function ScrollViewScreen() {
  const [isHorizontal, setHorizontal] = React.useState(true);
  const [isEnabled, setEnabled] = React.useState(true);
  const [isRefreshing, setRefreshing] = React.useState(false);
  const [removeClippedSubviews, setRemoveClippedSubviews] = React.useState(false);
  const scrollView = React.useRef<ScrollView>(null);
  const axis = isHorizontal ? 'x' : 'y';
  const { width } = useWindowDimensions();
  const isMobile = width <= 640;
  const imageStyle = {
    width,
    height: width / 2,
  };

  React.useEffect(() => {
    let timeout: any;
    if (isRefreshing) {
      timeout = setTimeout(() => setRefreshing(false), 2000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [isRefreshing]);

  const onRefresh = () => {
    setRefreshing(true);
  };
  const items = React.useMemo(() => [...Array(20)].map((_, i) => `Item ${i}`), []);
  return (
    <ScrollView
      style={{ flex: 1 }}
      removeClippedSubviews={removeClippedSubviews}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
      <View style={{ flex: 1, paddingHorizontal: isMobile ? 8 : 12 }}>
        <TitleSwitch
          title="Remove Clipped Subviews"
          value={removeClippedSubviews}
          setValue={setRemoveClippedSubviews}
        />
        <TitleSwitch title="Is Horizontal" value={isHorizontal} setValue={setHorizontal} />
        <TitleSwitch title="Is Enabled" value={isEnabled} setValue={setEnabled} />
        <ScrollView
          onScroll={() => {
            console.log('onScroll!');
          }}
          scrollEventThrottle={200}
          scrollEnabled={isEnabled}
          nestedScrollEnabled
          horizontal={isHorizontal}
          ref={scrollView}
          style={styles.scrollView}>
          {items.map((title: string, index: number) => (
            <Item key={index}>{title}</Item>
          ))}
        </ScrollView>
        <H3>Scroll to</H3>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button
            title="Start"
            style={{ flex: 1 }}
            onPress={() => {
              if (scrollView.current) {
                scrollView.current.scrollTo({ [axis]: 0 });
              }
            }}
          />
          <Button
            title="100px"
            style={{ flex: 1 }}
            onPress={() => {
              if (scrollView.current) {
                scrollView.current.scrollTo({ [axis]: 100 });
              }
            }}
          />
          <Button
            title="End"
            style={{ flex: 1 }}
            onPress={() => {
              if (scrollView.current) {
                scrollView.current.scrollToEnd({ animated: true });
              }
            }}
          />
        </View>
        <Button
          title="Flash scroll indicators (web only)"
          style={{ marginTop: 8 }}
          disabled={Platform.OS !== 'web'}
          onPress={() => {
            if (scrollView.current) {
              scrollView.current.flashScrollIndicators();
            }
          }}
        />
      </View>
      <H3 style={{ marginHorizontal: 8 }}>Pagination</H3>

      <ScrollView pagingEnabled directionalLockEnabled horizontal style={{ marginBottom: 8 }}>
        <Image
          source={require('../../assets/images/example1.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/images/example2.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
        <Image
          source={require('../../assets/images/example3.jpg')}
          style={imageStyle}
          resizeMode="cover"
        />
      </ScrollView>
    </ScrollView>
  );
}

ScrollViewScreen.navigationOptions = {
  title: 'ScrollView',
};

function Item(props: { children: React.ReactNode }) {
  return (
    <TouchableOpacity style={styles.item}>
      <Text style={{ fontSize: 16 }}>{props.children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#eeeeee',
    height: 300,
    flex: 1,
    maxHeight: 300,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  item: {
    margin: 5,
    padding: 8,
    backgroundColor: '#cccccc',
    borderRadius: 3,
    minWidth: 96,
    maxHeight: 96,
  },
});
