import TestSuite from '../test-suite/App.bare';
export default TestSuite;
// import React from 'react';
// import { View, AsyncStorage } from 'react-native';
// import { createAppContainer, createStackNavigator } from 'react-navigation';

// import TestSuite from '../test-suite/App.bare';

// // import NativeComponentList from '../native-component-list/App';

// const MainNavigator = createStackNavigator(
//   {
//     TestSuite,
//     // NativeComponentList: { screen: NativeComponentList, path: 'native-component-list' },
//   },
//   {
//     headerMode: 'none',
//     transitionConfig: () => ({
//       transitionSpec: {
//         duration: 0,
//       },
//     }),
//   }
// );

// let OutputNavigator = MainNavigator;

// // @ts-ignore
// // if (!global.DETOX) {
// //   const persistenceKey = 'persistenceKey';

// //   const persistNavigationState = async navState => {
// //     try {
// //       await AsyncStorage.setItem(persistenceKey, JSON.stringify(navState));
// //     } catch (err) {
// //       // handle the error according to your needs
// //     }
// //   };
// //   const loadNavigationState = async () => {
// //     const jsonString = await AsyncStorage.getItem(persistenceKey);
// //     return JSON.parse(jsonString);
// //   };

// //   OutputNavigator = React.forwardRef((props, ref) => (
// //     <MainNavigator
// //       ref={ref}
// //       {...props}
// //       persistNavigationState={persistNavigationState}
// //       loadNavigationState={loadNavigationState}
// //     />
// //   ));
// // }

// export default createAppContainer(OutputNavigator);
