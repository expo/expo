import { Button, BottomSheet } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { ScrollView, Text } from 'react-native';

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
            </BottomSheet>
        </ScrollView>
    );
}

BottomSheetScreen.navigationOptions = {
    title: 'BottomSheet',
};
