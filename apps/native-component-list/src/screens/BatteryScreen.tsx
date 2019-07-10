import React from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import * as Battery from 'expo-battery';

import ListButton from '../components/ListButton';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import { PowerState } from 'expo-battery/build/Battery.types';

interface State {
    batteryLevel?: number;
    batteryState?: string;
    powerState?: PowerState;
    lowPowerMode?: string;
}

interface Subscription {
    remove: () => void;
}

export default class BatteryScreen extends React.Component<{}, State> {
    static navigationOptions = {
        title: 'Battery',
    };

    readonly state: State = {};

    _subscriptionPowerMode?: Subscription | null;
    _subscriptionBatteryState?: Subscription | null;
    _subscriptionBatteryLevel?: Subscription | null;


    async componentDidMount() {
        await this._pingBattery();
        this._subscribePowerMode();
        this._subscribeBatteryState();
        this._subscribeBatteryLevel();
    }

    componentWillUnmount() {
        this._unsubscribe();
    }

    _pingBattery = async () => {
        let batteryLevel = await Battery.getBatteryLevelAsync();
        let batteryState = await Battery.getBatteryStateAsync();
        let lowPowerMode = await Battery.getLowPowerModeStatusAsync();
        let powerState = await Battery.getPowerStateAsync();
        this.setState({ batteryLevel, powerState, batteryState, lowPowerMode })
        console.log(batteryLevel);
        console.log(batteryState);
        console.log(powerState);
        console.log(lowPowerMode);
    }

    _subscribePowerMode = () => {
        this._subscriptionPowerMode = Battery.watchPowerModeChange(({ lowPowerMode }) => {
            this.setState({ lowPowerMode });
            console.log('low power mode changed!', lowPowerMode);
        });
        console.log('subscribed to watch low power mode');
    };
    _subscribeBatteryState = () => {
        this._subscriptionBatteryState = Battery.watchBatteryStateChange(({ batteryState }) => {
            this.setState({ batteryState });
            console.log('batteryState changed!', batteryState);
        });
        console.log('subscribed to watch batterystate');
    };
    _subscribeBatteryLevel = () => {
        this._subscriptionBatteryLevel = Battery.watchBatteryLevelChange(({ batteryLevel }) => {
            this.setState({ batteryLevel });
            console.log('batteryLevel changed!', batteryLevel);
        });
        console.log('subscribed to watch battery level');
    };
    _unsubscribe = () => {
        this._subscriptionPowerMode && this._subscriptionPowerMode.remove();
        this._subscriptionPowerMode = null;
        this._subscriptionBatteryState && this._subscriptionBatteryState.remove();
        this._subscriptionBatteryState = null;
        this._subscriptionBatteryLevel && this._subscriptionBatteryLevel.remove();
        this._subscriptionBatteryLevel = null;
        console.log('unsubscribed');
    };


    render() {
        return (
            <ScrollView style={{ padding: 10 }}>
                <ListButton
                    onPress={async () => {
                        const result = await Battery.getBatteryLevelAsync();
                        Alert.alert('Battery Level:', `${result}`);
                    }}
                    title="Get Battery Level"
                />
                <ListButton
                    onPress={async () => {
                        const result = await Battery.getBatteryStateAsync();
                        Alert.alert('Battery State:', `${result}`);
                    }}
                    title="Get Battery State"
                />
                <ListButton
                    onPress={async () => {
                        const result = await Battery.getLowPowerModeStatusAsync();
                        Alert.alert('Low Power Mode:', `${JSON.stringify(result)}`);
                    }}
                    title="Get Low Power Mode Status "
                />
                <ListButton
                    onPress={async () => {
                        const result = await Battery.getPowerStateAsync();
                        Alert.alert('Power State:', `${JSON.stringify(result)}`);
                    }}
                    title="Get Power State "
                />
                <ListButton
                    onPress={() => {
                        this._subscribeBatteryLevel(); 
                        this._subscribeBatteryState();
                        this._subscribePowerMode();
                    }}
                    title="Listen for battery state updates"
                />
                <ListButton
                    onPress={this._unsubscribe}
                    title="Stop listening for all battery updates"
                />
                <ListButton
                    onPress={this._pingBattery} 
                    title="Ping Battery info"
                />

                <HeadingText>Battery Level</HeadingText>
                <MonoText>{JSON.stringify(this.state.batteryLevel, null, 2)}</MonoText>

                <HeadingText>Battery State</HeadingText>
                <MonoText>{JSON.stringify(this.state.batteryState, null, 2)}</MonoText>

                <HeadingText>Low Power Mode</HeadingText>
                <MonoText>{JSON.stringify(this.state.lowPowerMode, null, 2)}</MonoText>

                <HeadingText>Power State</HeadingText>
                <MonoText>{JSON.stringify(this.state.powerState, null, 2)}</MonoText>

            </ScrollView>
        );
    }
}
