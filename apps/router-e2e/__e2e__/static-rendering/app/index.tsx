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
      <Image
        // autoplay
        source={current}
        contentFit="contain"
        transition={{
          effect: 'sf:pulse',
          repeat: 1,
        }}
        style={{
          width: 128,
          aspectRatio: 1,
        }}
      />
      <Pressable
        onPress={() => {
          setCurrent(current === 'sf:checkmark.circle' ? 'sf:faceid' : 'sf:checkmark.circle');
        }}>
        <Image
          source={current}
          // autoplay
          contentFit="contain"
          transition={{
            effect: 'sf:replace',
            repeat: 2,
            // duration: 2000,
          }}
          // tintColor="darkcyan"
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
