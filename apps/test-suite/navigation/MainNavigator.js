import * as React from 'react';
import { createDrawerNavigator } from 'react-navigation';

import TestsScreen from '../screens/TestsScreen';

import DrawerContentComponent from '../components/DrawerContentComponent';
const DrawerNavigator = createDrawerNavigator(
  {
    TestsScreen,
  },
  {
    // drawerType: 'back',
    // drawerPosition: 'right',
    // drawerWidth: 200,
    // drawerBackgroundColor: 'orange',
    contentComponent: DrawerContentComponent,
  }
);

export default DrawerNavigator;
// () => (

//       <DrawerNavigator {...props} screenProps={{ ...screenProps, onUpdateData }} />
//     )}
//   </ModulesProvider>
// )
// //   render() {
// //     const { screenProps = {}, ...props } = this.props;
// //     return (

// //     );
// //   }
// // }
