import { AppRegistry } from 'react-native';
import { createStackNavigator } from 'react-navigation';
import TokenFromCard from './src/TokenFromCard';
import Home from './src/Home';
import GooglePayScreen from './src/GooglePayScreen';
import CardFormScreen from './src/CardFormScreen';
import BySourceScreen from './src/BySourceScreen';
import ApplePayScreen from './src/ApplePay';

const RootStack = createStackNavigator(
  {
    HomeS: Home,
    TokenFromCardS: TokenFromCard,
    GooglePayS: GooglePayScreen,
    CardForm: CardFormScreen,
    BySource: BySourceScreen,
    ApplePay: ApplePayScreen,
  },
  {
    initialRouteName: 'HomeS',
  }
);

export default RootStack;

AppRegistry.registerComponent('example', () => RootStack);
