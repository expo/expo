import 'react-native';

import React from 'react';
import renderer from 'react-test-renderer';

import { GLView } from '../index';

// Note: test renderer must be required after react-native.
// TODO vonovak see why this fails
it.skip(`renders static`, async () => {
  const tree = renderer.create(
    <GLView msaaSamples={4} enableExperimentalWorkletSupport={false} onContextCreate={() => {}} />
  );
  expect(tree).toMatchSnapshot();
});
