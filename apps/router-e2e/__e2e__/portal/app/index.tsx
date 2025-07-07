import { ModalPortalContent, ModalPortalHost, usePathname } from 'expo-router';
import { createContext, use, useState } from 'react';
import { View, Text, Button, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TestContext = createContext({
  value: 0,
  setValue: (value: number) => {},
});

const HomeIndex = () => {
  const pathname = usePathname();
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#fdd', paddingTop: top }}>
      <Text>Home - Index</Text>
      <Text>Current Path: {pathname}</Text>
      <Text>Portal is below</Text>
      <ModalPortalHost hostId="test-portal" useContentHeight />
      <View style={{ height: 10, width: '100%' }} />
      <ModalPortalHost hostId="fluid-width-test-portal" />
      {/* <View style={{ flex: 1, backgroundColor: '#ddd', padding: 20 }} /> */}
      <Text>Portal is above</Text>
      <TestComponent />
    </View>
  );
};

function TestComponent() {
  const [value, setValue] = useState(1);

  return (
    <View style={{ padding: 20, backgroundColor: '#f00' }}>
      <Text>Test Component</Text>
      <Button title="Update Context" onPress={() => setValue(value + 1)} />
      <Text>Context Value: {value}</Text>
      <TestContext value={{ value, setValue }}>
        <ModalPortalContent hostId="test-portal">
          <TextModalPortalContent title="Portal Content" />
        </ModalPortalContent>
        <ModalPortalContent hostId="fluid-width-test-portal">
          <TextModalPortalContent style={{ flex: 1 }} title="Fluid Width Portal Content" />
        </ModalPortalContent>
        <ModalPortalContent hostId="fluid-height-test-portal">
          <TextModalPortalContent style={{ flex: 1 }} title="Fluid Height Portal Content" />
        </ModalPortalContent>
      </TestContext>
    </View>
  );
}

function TextModalPortalContent(props: { title: string; style?: ViewProps['style'] }) {
  const { value, setValue } = use(TestContext);
  const { title, style } = props;
  return (
    <View style={[{ padding: 20, backgroundColor: '#0f0' }, style]}>
      <Text>{title}</Text>
      <Button title="Increment Context Value" onPress={() => setValue(value + 1)} />
      <Text>Context Value: {value}</Text>
    </View>
  );
}

export default HomeIndex;
