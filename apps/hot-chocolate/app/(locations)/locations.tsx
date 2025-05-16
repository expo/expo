import { HStack, Host, Image, List, Picker, Spacer, Text } from '@expo/ui/swift-ui-primitives';
import { Link, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { LocationList } from '@/model';

const MY_FIXED_LOCATION = {
  latitude: 49.282729,
  longitude: -123.120735,
};

function getDistance(location: { latitude: number; longitude: number }): string {
  // Convert to kilometers using the Haversine formula
  const R = 6371; // Earth's radius in kilometers
  const lat1 = (MY_FIXED_LOCATION.latitude * Math.PI) / 180;
  const lat2 = (location.latitude * Math.PI) / 180;
  const deltaLat = ((location.latitude - MY_FIXED_LOCATION.latitude) * Math.PI) / 180;
  const deltaLon = ((location.longitude - MY_FIXED_LOCATION.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInKm = R * c;

  if (distanceInKm < 1) {
    // If less than 1km, show in meters
    return `${Math.round(distanceInKm * 1000)} m`;
  }

  // Show in km with 1 decimal place
  return `${distanceInKm.toFixed(1)} km`;
}

export default function Locations() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Location List',
          headerLargeTitle: true,
          headerSearchBarOptions: {
            hideWhenScrolling: true,
          },
          headerRight: () => {
            return (
              <Host style={{ width: 220, height: 20 }}>
                <HStack>
                  <Spacer />
                  <Text>Sort by:</Text>
                  <Picker
                    variant="menu"
                    options={['Name', 'Distance']}
                    selectedIndex={0}
                    onOptionSelected={({ nativeEvent: { index } }) => {
                      console.log(index);
                    }}
                  />
                </HStack>
              </Host>
            );
          },
        }}
      />
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <List scrollEnabled>
          {LocationList.map((item) => (
            <Link href={`/locations/${item.id}`} asChild key={item.id}>
              <HStack spacing={8}>
                <Text size={14}>{`${item.name}`}</Text>
                <Spacer />
                <Text size={14} color="secondary">
                  {getDistance({
                    // For demo purposes, use the first store's location
                    latitude: item.stores[0].point[0],
                    longitude: item.stores[0].point[1],
                  })}
                </Text>
                <Image systemName="chevron.right" size={14} color="secondary" />
              </HStack>
            </Link>
          ))}
        </List>
      </Host>
    </>
  );
}
