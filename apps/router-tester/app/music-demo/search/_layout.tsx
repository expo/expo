import Stack from 'expo-router/stack';

export default function SearchLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Search',
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: 'Artists, Songs, Lyrics, and More',
          },
        }}
      />
    </Stack>
  );
}
