import React from 'react';
import Animated from '../Animated';

import renderer from 'react-test-renderer';

jest.mock('../ReanimatedEventEmitter');
jest.mock('../ReanimatedModule');

describe('Core Animated components', () => {
  xit('fails if something other then a node or function that returns a node is passed to Animated.Code exec prop', () => {
    console.error = jest.fn();

    expect(() =>
      renderer.create(<Animated.Code exec="not a node" />)
    ).toThrowError(
      "<Animated.Code /> expects the 'exec' prop or children to be an animated node or a function returning an animated node."
    );
  });

  xit('fails if something other then a node or function that returns a node is passed to Animated.Code children', () => {
    console.error = jest.fn();

    expect(() =>
      renderer.create(<Animated.Code>not a node</Animated.Code>)
    ).toThrowError(
      "<Animated.Code /> expects the 'exec' prop or children to be an animated node or a function returning an animated node."
    );
  });
});
