import { Dimensions } from 'react-native';
import { createDrawerNavigator } from 'react-navigation';

import Tests from '../screens/TestsScreen';
import ControlList from '../components/ControlList';

export default createDrawerNavigator(
  {
    Tests,
  },
  {
    drawerType: 'slide',
    drawerWidth: Dimensions.get('window').width / 2,
    contentComponent: ControlList,
  }
);
