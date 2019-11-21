import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createStackNavigator } from 'react-navigation-stack';

import ModulesProvider from './ModulesProvider';
import SelectScreen from './screens/SelectScreen';
import TestScreen from './screens/TestScreen';

const AppNavigator = createStackNavigator(
    {
        select: {
            screen: SelectScreen,
            path: 'select',
            navigationOptions: {
                title: 'Test Suite',
            },
        },
        run: {
            screen: TestScreen,
            path: 'run/:tests',
            navigationOptions: {
                title: 'Test Runner',
            },
        },
    },
    {
        headerMode: 'screen',
        transitionConfig: global.DETOX ? () => ({
            transitionSpec: {
                duration: 0,
            },
        }) : undefined,
        defaultNavigationOptions: {
            headerStyle: {
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0,0,0,0.1)',
                boxShadow: undefined,
            },
        },
    }
);

function CustomNavigator(props) {
    return (
        <SafeAreaProvider>
            <ModulesProvider>
                <AppNavigator {...props} />
            </ModulesProvider>
        </SafeAreaProvider>
    );
}
CustomNavigator.router = AppNavigator.router;

export default CustomNavigator;
