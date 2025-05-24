import { Form, HStack, Host, Picker, Text, VStack } from '@expo/ui/swift-ui-primitives';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme, useWindowDimensions } from 'react-native';

import FlavourGroup from '@/components/FlavourGroup';
import { FlavourList, LocationList, type Store } from '@/model';

export default function LocationDetails() {
  const { id, hideStorePicker } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();

  const location = LocationList.find((item) => item.id === Number(id));
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const flavours = FlavourList.filter((flavour) => flavour.location === Number(id)) ?? [];

  useEffect(() => {
    if (location) {
      setSelectedStore(location.stores[0] as Store);
    }
  }, [location]);

  if (!location) {
    return (
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <VStack padding={{ top: 16, leading: 16, bottom: 16, trailing: 16 }}>
          <Text>Location not found</Text>
        </VStack>
      </Host>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: location.name }} />
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <VStack alignment="leading">
          {!hideStorePicker ? (
            <VStack
              padding={{ top: 16, leading: 16, bottom: 16, trailing: 16 }}
              alignment="leading"
              frame={{ maxWidth: windowWidth, alignment: 'leading' }}
              spacing={8}
              backgroundColor={colorScheme === 'dark' ? 'black' : 'white'}>
              <HStack>
                <Text>Store: </Text>
                <Picker
                  variant="menu"
                  options={location.stores.map((store) => store.name)}
                  selectedIndex={location.stores.findIndex(
                    (store) => store.name === selectedStore?.name
                  )}
                  onOptionSelected={({ nativeEvent: { index } }) => {
                    setSelectedStore(location.stores[index] as Store);
                  }}
                />
              </HStack>
              <HStack
                onPress={() =>
                  Linking.openURL(
                    `https://maps.apple.com/?ll=${selectedStore?.point[0]},${selectedStore?.point[1]}`
                  )
                }>
                <Text color="#007AFF">{selectedStore?.address ?? ''}</Text>
              </HStack>
              <Text>{selectedStore?.hours ?? ''}</Text>
            </VStack>
          ) : null}
          <Form>
            {flavours.map((flavour) => (
              <FlavourGroup key={flavour.id} flavour={flavour} />
            ))}
          </Form>
        </VStack>
      </Host>
    </>
  );
}
