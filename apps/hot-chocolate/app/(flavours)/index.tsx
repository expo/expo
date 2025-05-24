import {
  Button,
  ContextMenu,
  HStack,
  Host,
  Image,
  List,
  Spacer,
  Text,
} from '@expo/ui/swift-ui-primitives';
import { Link, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { FlavourList } from '@/model';

export default function Index() {
  const colorScheme = useColorScheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Flavour List',
          headerLargeTitle: true,
          headerSearchBarOptions: {
            hideWhenScrolling: true,
          },
          headerRight: () => {
            return (
              <Host style={{ width: 28, height: 28 }}>
                <ContextMenu>
                  <ContextMenu.Items>
                    <Button onPress={() => {}}>Show Favourites Only</Button>
                    <Button onPress={() => {}}>Hide Tasted</Button>
                    <Button onPress={() => {}}>Show Current Only</Button>
                    <Button onPress={() => {}}>Show Vegan Only</Button>
                    <Button onPress={() => {}}>Show Dairy Free Only</Button>
                    <Button onPress={() => {}}>Show Gluten Free Only</Button>
                    <Button onPress={() => {}}>Show Nut Free Only</Button>
                    <Button onPress={() => {}}>Show Alcohol Free Only</Button>
                  </ContextMenu.Items>
                  <ContextMenu.Trigger>
                    <Image systemName="line.3.horizontal.decrease.circle" size={24} />
                  </ContextMenu.Trigger>
                </ContextMenu>
              </Host>
            );
          },
        }}
      />
      <Host style={{ flex: 1 }} colorScheme={colorScheme}>
        <List>
          {FlavourList.map((item, index) => (
            <Link href={`/flavours/${item.id}`} asChild key={index}>
              <HStack spacing={8}>
                <Text size={14} color="secondary">{`#${index + 1}:`}</Text>
                <Text size={14}>{`${item.name}`}</Text>
                <Spacer />
                <Image systemName="chevron.right" size={14} color="secondary" />
              </HStack>
            </Link>
          ))}
        </List>
      </Host>
    </>
  );
}
