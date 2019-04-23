import { createStackNavigator, createAppContainer } from 'react-navigation';
import SelectScreen from './screens/SelectScreen';
import TestScreen from './screens/TestScreen';

const MainNavigator = createStackNavigator({
  Select: SelectScreen,
  RunTests: TestScreen,
});

const App = createAppContainer(MainNavigator);

export default App;
