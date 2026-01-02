import { Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Color } from 'expo-router';

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

      <Image
        source={'sf:wifi'}
        contentFit="contain"
        transition={{
          effect: 'sf:rotate/by-layer',
          repeat: -1,
        }}
        style={{
          tintColor: Color.ios.systemCyan,
          width: 64,
          aspectRatio: 1,
        }}
      />

      {current === 'sf:checkmark.circle' && (
        <Image
          autoplay
          source={'sf:signature'}
          contentFit="contain"
          transition={{
            effect: 'sf:draw-on',
            // repeat: 1,
          }}
          style={{
            width: 128,
            aspectRatio: 1,
          }}
        />
      )}
    </>
  );
}
