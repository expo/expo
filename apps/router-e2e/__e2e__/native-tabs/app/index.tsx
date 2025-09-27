import { DetailContent, ListContent, ListDetail } from '@expo/ui/jetpack-compose';
import { useEffect, useState } from 'react';
import { Text, View, Dimensions } from 'react-native';

export default function Index() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    // Increment key on dimension changes
    const subscription = Dimensions.addEventListener('change', () => {
      setKey((prevKey) => prevKey + 1);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ListDetail
        key={key}
        style={{ flex: 1 }}
        onLayout={(e) => console.log('ListDetail onLayout', e.nativeEvent.layout)}>
        <ListContent
          // onLayout={(e) => console.log('ListContent onLayout', e.nativeEvent.layout)}
          style={{
            position: 'absolute',
          }}>
          <View
            style={{
              flex: 1,
              backgroundColor: 'lightgrey',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text>List Content</Text>
          </View>
        </ListContent>
        <DetailContent
          // onLayout={(e) => console.log('DetailContent onLayout', e.nativeEvent.layout)}
          style={{
            position: 'absolute',
          }}>
          <View
            style={{
              flex: 1,
              // backgroundColor: 'lightblue',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text>Detail Content</Text>
          </View>
        </DetailContent>
      </ListDetail>
    </View>
  );
}
