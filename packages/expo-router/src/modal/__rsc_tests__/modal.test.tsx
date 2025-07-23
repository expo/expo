/// <reference types="jest-expo/rsc/expect" />
import * as React from 'react';
import { Text } from 'react-native';

import { Modal } from '../Modal';

it(`renders Modal`, async () => {
  await expect(
    <Modal visible>
      <Text>Hello World</Text>
    </Modal>
  ).toMatchFlightSnapshot();
});
