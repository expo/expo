import { useState } from 'react';
import { Button } from 'react-native';

import MarshalProps from './www/marshal-props';

export default function Route() {
  const [index, setIndex] = useState(0);

  return (
    <>
      <MarshalProps
        index={index}
        onPress={() => {
          console.log('Pressed');
          setIndex((index) => index + 1);
        }}
      />

      <Button onPress={() => setIndex((index) => index + 1)} title="Increment" />
    </>
  );
}
