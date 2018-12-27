import { createDrawerNavigator } from 'react-navigation';

import DrawerContentComponent from '../components/DrawerContentComponent';
import TestsScreen from '../screens/TestsScreen';

export default createDrawerNavigator(
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
