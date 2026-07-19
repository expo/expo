import { SafeAreaView } from 'react-native-safe-area-context';

const HomeLayout = (props) => {
  return (
    <SafeAreaView style={{ flex: 1 }} testID="layout-child-wrapper">
      {props.children}
    </SafeAreaView>
  );
};

export default HomeLayout;
