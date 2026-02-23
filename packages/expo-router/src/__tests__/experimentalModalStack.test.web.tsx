/** @jest-environment jsdom */
import { render } from '@testing-library/react';
import React from 'react';

import ExperimentalModalStack from '../layouts/ExperimentalModalStack';
import { StackScreen } from '../layouts/stack-utils';
import { isChildOfType } from '../utils/children';
import { Screen } from '../views/Screen';

// Mock RouterModal to capture props without rendering children (Screen throws if rendered with name outside layout)
const mockRouterModal = jest.fn((_props: any) => null);
jest.mock('../modal/web/ModalStack', () => ({
  RouterModal: (props: any) => mockRouterModal(props),
}));

// Mock StackClient to only provide stackRouterOverride
jest.mock('../layouts/StackClient', () => ({
  stackRouterOverride: jest.fn(),
}));

beforeEach(() => {
  mockRouterModal.mockClear();
});

describe('ExperimentalModalStack', () => {
  it('converts StackScreen children to Screen children', () => {
    render(
      <ExperimentalModalStack>
        <StackScreen name="index" options={{ title: 'Home' }} />
        <StackScreen name="details" options={{ title: 'Details' }} />
      </ExperimentalModalStack>
    );

    expect(mockRouterModal).toHaveBeenCalledTimes(1);

    const passedChildren = mockRouterModal.mock.calls[0][0].children;
    const childArray = React.Children.toArray(passedChildren);

    expect(childArray).toHaveLength(2);
    childArray.forEach((child) => {
      expect(isChildOfType(child, Screen)).toBe(true);
      expect(isChildOfType(child, StackScreen)).toBe(false);
    });
  });

  it('preserves Screen options after conversion', () => {
    render(
      <ExperimentalModalStack>
        <StackScreen name="profile" options={{ title: 'Profile Page' }} />
      </ExperimentalModalStack>
    );

    expect(mockRouterModal).toHaveBeenCalledTimes(1);

    const passedChildren = mockRouterModal.mock.calls[0][0].children;
    const childArray = React.Children.toArray(passedChildren);

    expect(childArray).toHaveLength(1);
    const screenChild = childArray[0] as React.ReactElement<any>;
    expect(screenChild.props.name).toBe('profile');
    expect(screenChild.props.options).toMatchObject({ title: 'Profile Page' });
  });

  it('passes other props through to RouterModal', () => {
    render(
      <ExperimentalModalStack screenOptions={{ headerShown: false }}>
        <StackScreen name="index" />
      </ExperimentalModalStack>
    );

    expect(mockRouterModal).toHaveBeenCalledTimes(1);
    expect(mockRouterModal.mock.calls[0][0].screenOptions).toEqual({ headerShown: false });
  });
});
