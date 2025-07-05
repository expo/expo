import { Button, BottomSheet } from '@expo/ui/jetpack-compose';
import { Container } from '@expo/ui/jetpack-compose-primitives';
import * as React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export default function BottomSheetScreen() {
    const [isOpened, setIsOpened] = React.useState<boolean>(false);

    return (
        <ScrollView
            contentContainerStyle={{
                flex: 1,
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                padding: 8,
            }}>
            <Button onPress={() => setIsOpened((h) => !h)}>Toggle</Button>
            <Text>isOpened: {isOpened ? 'yes' : 'no'}</Text>
            <BottomSheet isOpened={isOpened} onIsOpenedChange={(e) => setIsOpened(e)}>
                <Text>Hello world</Text>
                    <View style={{height: 100, width: 100, backgroundColor: 'red'}}>
                        <Text>Hello world</Text>
                    </View>
            </BottomSheet>
        </ScrollView>
    );
}

BottomSheetScreen.navigationOptions = {
    title: 'BottomSheet',
};
