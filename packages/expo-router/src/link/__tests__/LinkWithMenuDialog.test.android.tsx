import { render, fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { LinkWithMenuDialog } from '../LinkWithMenuDialog';
import { LinkMenu, LinkMenuAction, LinkTrigger } from '../elements';

jest.mock('../preview/PreviewRouteContext', () => ({
  useIsPreview: jest.fn(() => false),
}));

describe('LinkWithMenuDialog', () => {
  it('shows modal with action items on long press', () => {
    const onPress1 = jest.fn();
    const onPress2 = jest.fn();

    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text testID="trigger">Press me</Text>
        </LinkTrigger>
        <LinkMenu title="Test Menu">
          <LinkMenuAction onPress={onPress1}>Action 1</LinkMenuAction>
          <LinkMenuAction onPress={onPress2}>Action 2</LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    expect(screen.queryByText('Action 1')).toBeNull();
    expect(screen.queryByText('Action 2')).toBeNull();

    fireEvent(screen.getByText('Press me'), 'longPress');

    expect(screen.getByText('Action 1')).toBeVisible();
    expect(screen.getByText('Action 2')).toBeVisible();
  });

  it('calls onPress and dismisses modal when action is tapped', () => {
    const onPress = jest.fn();

    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text testID="trigger">Press me</Text>
        </LinkTrigger>
        <LinkMenu>
          <LinkMenuAction onPress={onPress}>Do something</LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');
    expect(screen.getByText('Do something')).toBeVisible();

    fireEvent.press(screen.getByText('Do something'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Do something')).toBeNull();
  });

  it('excludes nested LinkMenu children (only flat actions shown)', () => {
    const flatActionPress = jest.fn();
    const nestedActionPress = jest.fn();

    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text testID="trigger">Press me</Text>
        </LinkTrigger>
        <LinkMenu title="Root Menu">
          <LinkMenuAction onPress={flatActionPress}>Flat Action</LinkMenuAction>
          <LinkMenu title="Nested Menu">
            <LinkMenuAction onPress={nestedActionPress}>Nested Action</LinkMenuAction>
          </LinkMenu>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');

    expect(screen.getByText('Flat Action')).toBeVisible();
    expect(screen.queryByText('Nested Action')).toBeNull();
    expect(screen.queryByText('Nested Menu')).toBeNull();
  });

  it('applies destructive styling to destructive actions', () => {
    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text>Press me</Text>
        </LinkTrigger>
        <LinkMenu>
          <LinkMenuAction onPress={() => {}} destructive>
            Delete
          </LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');

    const deleteText = screen.getByText('Delete');
    expect(deleteText.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#FF3B30' })])
    );
  });

  it('applies disabled styling and does not call onPress on disabled actions', () => {
    const onPress = jest.fn();

    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text>Press me</Text>
        </LinkTrigger>
        <LinkMenu>
          <LinkMenuAction onPress={onPress} disabled>
            Disabled Action
          </LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');

    const disabledText = screen.getByText('Disabled Action');
    expect(disabledText.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0.38 })])
    );

    // Pressing the disabled action should not call onPress
    fireEvent.press(screen.getByText('Disabled Action'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('displays the dialog title from LinkMenu title prop', () => {
    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text>Press me</Text>
        </LinkTrigger>
        <LinkMenu title="My Menu Title">
          <LinkMenuAction onPress={() => {}}>Action</LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');

    expect(screen.getByText('My Menu Title')).toBeVisible();
  });

  it('does not show title when LinkMenu has no title', () => {
    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text>Press me</Text>
        </LinkTrigger>
        <LinkMenu>
          <LinkMenuAction onPress={() => {}}>Action</LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');

    expect(screen.getByText('Action')).toBeVisible();
    expect(screen.queryByText('My Menu Title')).toBeNull();
  });

  it('dismisses modal when backdrop is pressed', () => {
    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text>Press me</Text>
        </LinkTrigger>
        <LinkMenu>
          <LinkMenuAction onPress={() => {}}>Action</LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');
    expect(screen.getByText('Action')).toBeVisible();

    fireEvent.press(screen.getByTestId('menu-dialog-backdrop'));

    expect(screen.queryByText('Action')).toBeNull();
  });

  it('uses title prop as fallback when children is not a string', () => {
    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text>Press me</Text>
        </LinkTrigger>
        <LinkMenu>
          <LinkMenuAction title="Title Fallback" onPress={() => {}}>
            <View />
          </LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');

    expect(screen.getByText('Title Fallback')).toBeVisible();
  });

  it('falls back to rendering children as trigger when no LinkTrigger is present', () => {
    render(
      <LinkWithMenuDialog href="/test">
        <Text testID="plain-child">Plain child</Text>
        <LinkMenu>
          <LinkMenuAction onPress={() => {}}>Action</LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    expect(screen.getByTestId('plain-child')).toBeVisible();
  });

  it('does not show modal when there are no actions', () => {
    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text>Press me</Text>
        </LinkTrigger>
        <LinkMenu title="Empty Menu" />
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');

    expect(screen.queryByTestId('menu-dialog-backdrop')).toBeNull();
  });

  it('filters out hidden actions', () => {
    render(
      <LinkWithMenuDialog href="/test">
        <LinkTrigger>
          <Text>Press me</Text>
        </LinkTrigger>
        <LinkMenu>
          <LinkMenuAction onPress={() => {}}>Visible Action</LinkMenuAction>
          <LinkMenuAction onPress={() => {}} hidden>
            Hidden Action
          </LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');

    expect(screen.getByText('Visible Action')).toBeVisible();
    expect(screen.queryByText('Hidden Action')).toBeNull();
  });

  it('forwards user-provided onLongPress handler', () => {
    const userOnLongPress = jest.fn();

    render(
      <LinkWithMenuDialog href="/test" onLongPress={userOnLongPress}>
        <LinkTrigger>
          <Text>Press me</Text>
        </LinkTrigger>
        <LinkMenu>
          <LinkMenuAction onPress={() => {}}>Action</LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    fireEvent(screen.getByText('Press me'), 'longPress');

    expect(userOnLongPress).toHaveBeenCalledTimes(1);
    // Modal should also appear
    expect(screen.getByText('Action')).toBeVisible();
  });

  it('does not render LinkMenu as visible content when no LinkTrigger is present', () => {
    const { toJSON } = render(
      <LinkWithMenuDialog href="/test">
        <Text testID="plain-child">Plain child</Text>
        <LinkMenu title="Should Not Render">
          <LinkMenuAction onPress={() => {}}>Action</LinkMenuAction>
        </LinkMenu>
      </LinkWithMenuDialog>
    );

    // LinkMenu should be filtered out from the rendered trigger
    const json = JSON.stringify(toJSON());
    expect(json).not.toContain('Should Not Render');
  });
});
