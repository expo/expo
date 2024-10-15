import { Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeLayout = (props) => {
  console.log('Props:', props);

  const isProduct = props.path.match(/^\/product/);

  return <>{props.children}</>;
  //   return (
  //     <SafeAreaView style={{ flex: 1 }} testID="layout-child-wrapper">
  //       {isProduct ? (
  //         <Modal presentationStyle="formSheet" animationType="slide">
  //           {props.children}
  //         </Modal>
  //       ) : (
  //         <>{props.children}</>
  //       )}
  //     </SafeAreaView>
  //   );
};

export default HomeLayout;
