'use client';

import { Button } from 'react-native';

export function SomeButton(props) {
  return (
    <>
      <Button {...props} onPress={() => props.onPress()} />
    </>
  );
}
