
import BluetoothScreen from './BluetoothScreen';
import BluetoothPeripheralScreen from './BluetoothPeripheralScreen';
import { createAppContainer, createStackNavigator } from 'react-navigation'

export default createAppContainer(createStackNavigator({
    BluetoothScreen,
    BluetoothPeripheralScreen
}))