import { Host, Carousel, Box } from '@expo/ui/jetpack-compose';
import { background, size } from '@expo/ui/jetpack-compose/modifiers';
import { Image } from 'expo-image';
import * as React from 'react';
import { View } from 'react-native';

export default function CarouselScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Host style={{ backgroundColor: 'blue', width: '100%', height: 300 }}>
        <Carousel
          variant="multiBrowse"
          itemSpacing={30}
          minSmallItemWidth={10}
          maxSmallItemWidth={300}
          flingBehavior="noSnap">
          <Image
            source={{ uri: 'https://picsum.photos/400' }}
            style={{ width: 200, height: 200 }}
          />
          <Image
            source={{ uri: 'https://picsum.photos/401' }}
            style={{ width: 200, height: 200 }}
          />
          <Image
            source={{ uri: 'https://picsum.photos/403' }}
            style={{ width: 200, height: 200 }}
          />
          <Image
            source={{ uri: 'https://picsum.photos/404' }}
            style={{ width: 200, height: 200 }}
          />
          <Image
            source={{ uri: 'https://picsum.photos/405' }}
            style={{ width: 200, height: 200 }}
          />
          <Image
            source={{ uri: 'https://picsum.photos/406' }}
            style={{ width: 200, height: 200 }}
          />
        </Carousel>
      </Host>
      <Host style={{ backgroundColor: 'blue', width: '100%', height: 300 }}>
        <Carousel
          itemSpacing={30}
          variant="unconstrained"
          minSmallItemWidth={10}
          maxSmallItemWidth={300}>
          <Box modifiers={[size(200, 200), background('#f00000')]} />
          <Box modifiers={[size(200, 200), background('#f0f000')]} />
          <Box modifiers={[size(200, 200), background('#00f000')]} />
          <Box modifiers={[size(200, 200), background('#00f000')]} />
          <Box modifiers={[size(200, 200), background('#00f000')]} />
          <Box modifiers={[size(200, 200), background('#00f000')]} />
        </Carousel>
      </Host>
    </View>
  );
}

CarouselScreen.navigationOptions = {
  title: 'Carousel',
};
