import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './components/Login';
import Register from './components/Register';
import CustomerManagement from './components/CustomerManagement';
import CustomerList from './components/CustomerList';
import CustomerUpdate from './components/CustomerUpdate';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="CustomerManagement" component={CustomerManagement} />
        <Stack.Screen name="CustomerList" component={CustomerList} />
        <Stack.Screen name="CustomerUpdate" component={CustomerUpdate} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;