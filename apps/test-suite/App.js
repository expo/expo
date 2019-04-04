import { createStackNavigator, createAppContainer } from 'react-navigation';
import SelectScreen from './SelectScreen';
import TestScreen from './TestScreen';

const MainNavigator = createStackNavigator({
  Select: SelectScreen,
  RunTests: TestScreen,
});

const App = createAppContainer(MainNavigator);

export default App;
