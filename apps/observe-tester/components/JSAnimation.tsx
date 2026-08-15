import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

export function JSAnimation() {
  const [x, setX] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(
      () => {
        setX((prevX) => (prevX + 1) % 300);
      },
      Platform.OS === 'ios' ? 10 : 100
    );

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <View style={{ width: '100%', height: 100 }}>
      <View
        key={x}
        style={{
          height: '100%',
          aspectRatio: 1,
          marginLeft: x,
        }}>
        {Array.from({ length: 1000 }).map((_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              backgroundColor: index % 2 === 0 ? 'blue' : 'green',
            }}
          />
        ))}
      </View>
    </View>
  );
}
