import {
  BottomSheet,
  Form,
  Group,
  HStack,
  Host,
  Image,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui-primitives';
import * as Linking from 'expo-linking';
import { AppleMaps } from 'expo-maps';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';

import FlavourGroup from '@/components/FlavourGroup';
import { type Flavour, FlavourList, LocationList, type Store } from '@/model';

// Add backtraced location data to the store.
// When clicking on a store, we can display the location metadata directly.
interface ExtendedStore extends Store {
  locationName: string;
  locationId: number;
  locationDescription: string;
  locationInstagram: string;
  locationWebsite: string;
  locationFlavours: Flavour[];
}

const STORES: ExtendedStore[] = LocationList.flatMap((location) =>
  location.stores.map((store) => ({
    ...store,
    point: [store.point[0], store.point[1]],
    locationName: location.name,
    locationId: location.id,
    locationDescription: location.description,
    locationInstagram: location.instagram,
    locationWebsite: location.website,
    locationFlavours: FlavourList.filter((flavour) => flavour.location === location.id),
  }))
);

export default function Tab() {
  const [selectedStore, setSelectedStore] = useState<ExtendedStore | null | undefined>(null);
  const { height: windowHeight } = useWindowDimensions();

  return (
    <>
      <AppleMaps.View
        style={{ flex: 1 }}
        markers={STORES.map((store) => ({
          id: String(store.locationId),
          coordinates: {
            latitude: store.point[0],
            longitude: store.point[1],
          },
          systemImage: 'cup.and.saucer.fill',
          title: `${store.locationName} - ${store.name}`,
        }))}
        onMarkerClick={(e) => {
          setSelectedStore(STORES.find((store) => String(store.locationId) === e.id));
        }}
        cameraPosition={{
          // At proper place to cover most of the stores
          coordinates: {
            latitude: 49.2204375,
            longitude: -123.1236355,
          },
          zoom: 10,
        }}
        uiSettings={{ myLocationButtonEnabled: false }}
      />
      <Host>
        <BottomSheet
          isOpened={!!selectedStore}
          onIsOpenedChange={(e) => setSelectedStore(e ? selectedStore : null)}>
          <VStack
            padding={{ top: 16, leading: 2, bottom: 2, trailing: 2 }}
            frame={{ height: windowHeight * 0.5 }}
            spacing={8}
            alignment="leading">
            <HStack padding={{ trailing: 8, bottom: 8 }}>
              <Spacer />
              <Image
                systemName="xmark.circle.fill"
                color="secondary"
                size={24}
                onPress={() => setSelectedStore(null)}
              />
            </HStack>
            <Group padding={{ leading: 16, trailing: 16 }}>
              <Text size={24} weight="bold">
                {selectedStore?.locationName ?? ''}
              </Text>
              <HStack
                onPress={() =>
                  Linking.openURL(
                    `https://maps.apple.com/?ll=${selectedStore?.point[0]},${selectedStore?.point[1]}`
                  )
                }>
                <Text color="#007AFF">{selectedStore?.address ?? ''}</Text>
              </HStack>
              <Text size={14} color="secondary">
                {selectedStore?.hours ?? ''}
              </Text>
            </Group>
            <Form>
              {selectedStore?.locationFlavours.map((flavour) => (
                <FlavourGroup key={flavour.id} flavour={flavour} />
              ))}
            </Form>
          </VStack>
        </BottomSheet>
      </Host>
    </>
  );
}
