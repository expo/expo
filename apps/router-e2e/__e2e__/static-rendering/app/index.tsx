import { Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';

export default function Page() {
  const [current, setCurrent] = useState('sf:checkmark.circle');
  return (
    <>
      <Text testID="index-text" style={{ fontFamily: 'sweet' }}>
        Index
      </Text>
      <Image
        source="sf:star.fill"
        // contentFit="contain"

        style={{
          width: 128,
          // aspectRatio: 1,
          height: 128 * 2,
          // backgroundColor: 'blue',
          tintColor: 'orange',
          // fontWeight: '100',
        }}
      />
      <Pressable
        onPress={() => {
          setCurrent(current === 'sf:checkmark.circle' ? 'sf:heart.fill' : 'sf:checkmark.circle');
        }}>
        <Image
          source={current}
          autoplay={false}
          contentFit="contain"
          transition={{
            effect: 'sf:replace',
            duration: 2000,
          }}
          tintColor="darkcyan"
          style={{
            width: 128,
            aspectRatio: 1,
            // backgroundColor: 'blue',

            // fontWeight: '100',
          }}
        />
      </Pressable>
    </>
  );
}
