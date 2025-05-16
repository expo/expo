import { HStack, Host, Image, Text, VStack } from '@expo/ui/swift-ui-primitives';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { FlavourList, LocationList } from '@/model';

export default function FlavourDetails() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();

  const flavour = FlavourList.find((item) => item.id === Number(id));
  const location = LocationList.find((item) => item.id === flavour?.location);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isTasted, setIsTasted] = useState(false);

  if (!flavour) {
    return (
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <VStack padding={{ top: 16, leading: 16, bottom: 16, trailing: 16 }}>
          <Text>Flavour not found</Text>
        </VStack>
      </Host>
    );
  }

  const label = `#${flavour.id} - ${flavour.name}`;
  const dateRange = `${formatDate(flavour.startDate)} to ${formatDate(flavour.endDate)}`;
  return (
    <>
      <Stack.Screen options={{ title: label }} />
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <VStack
          padding={{ top: 16, leading: 16, bottom: 16, trailing: 16 }}
          spacing={16}
          alignment="leading">
          {location ? (
            <Link href={`/locations/${location.id}?hideStorePicker=true`} asChild>
              <HStack>
                <Text size={20} color="#007AFF" weight="semibold">
                  {location.name}
                </Text>
              </HStack>
            </Link>
          ) : null}
          <HStack spacing={8}>
            <Text size={24} weight="bold">
              {label}
            </Text>
            <Image
              systemName={isFavourite ? 'star.fill' : 'star'}
              size={18}
              color={isFavourite ? '#FFD700' : 'secondary'}
              onPress={() => setIsFavourite(!isFavourite)}
            />
            <Image
              systemName={isTasted ? 'checkmark.seal.fill' : 'checkmark.seal'}
              size={18}
              color={isTasted ? '#007AFF' : 'secondary'}
              onPress={() => setIsTasted(!isTasted)}
            />
          </HStack>

          <Text size={14} color="secondary">
            {dateRange}
          </Text>

          <Text size={16}>{flavour.description}</Text>
        </VStack>
      </Host>
    </>
  );
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString();
}
