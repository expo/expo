import { Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Color } from 'expo-router';

export default function Page() {
  const [current, setCurrent] = useState('sf:checkmark.circle');
  const [on, setOn] = useState(true);
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
        source="sf:checkmark.circle"
        contentFit="contain"
        transition={{
          effect: 'sf:breathe',
          scope: 'whole-symbol',
          repeat: -1,
        }}
        style={{
          tintColor: Color.ios.systemCyan,
          width: 64,
          aspectRatio: 1,
        }}
      />

      <Pressable
        onPress={() => {
          setOn(!on);
        }}>
        <Image
          autoplay
          source="sf:signature"
          contentFit="contain"
          transition={{
            effect: on ? 'sf:draw/on' : 'sf:draw/off',
            scope: 'by-layer',
            // repeat: 1,
          }}
          style={{
            width: 128,
            aspectRatio: 1,
            // fontWeight: '200',
          }}
        />
      </Pressable>
    </>
  );
}
