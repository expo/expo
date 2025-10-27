import { Image } from 'expo-image';
import * as React from 'react';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

Image.configureCache({
  maxMemoryCount: 3 * 9,
  maxMemoryCost: 100 * 1024 * 1024,
});

export default function ImageCacheEvictionScreen() {
  const [changing, setChanging] = useState(false);
  const iRef = useRef(0);
  const timeoutRef = useRef<any>(null);

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      {!changing && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
          }}>
          {new Array(9).fill(0).map((_, i) => (
            <Image
              key={i}
              source={{
                uri: 'https://placebear.com/800/600?image=' + iRef.current++,
              }}
              cachePolicy="memory"
              style={{
                width: 100,
                height: 100,
                margin: 4,
              }}
              contentFit="contain"
            />
          ))}
        </View>
      )}

      <Pressable
        onPress={() => {
          clearTimeout(timeoutRef.current ?? undefined);
          setChanging(true);
          timeoutRef.current = setTimeout(() => {
            setChanging(false);
          }, 100);
        }}
        style={{ alignSelf: 'center', marginTop: 16 }}>
        <Text>Change</Text>
      </Pressable>
    </View>
  );
}
