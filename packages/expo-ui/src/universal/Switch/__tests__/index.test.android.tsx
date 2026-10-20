import { render } from '@testing-library/react-native';

import { Switch } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';

jest.mock('expo');

function findModifier(viewName: string, type: string) {
  return findNativeViewProps(viewName)?.modifiers?.find((m: any) => m.$type === type);
}

function fireToggleable(viewName: string) {
  findNativeViewProps(viewName).onGlobalEvent({ nativeEvent: { payload: ['toggleable', {}] } });
}

describe('Switch', () => {
  it('keeps the switch as the interactive node without a label', async () => {
    const onValueChange = jest.fn();
    await render(<Switch value={false} onValueChange={onValueChange} />);

    expect(findNativeViewProps('RowView')).toBeUndefined();
    expect(findNativeViewProps('SwitchView')).toMatchObject({
      value: false,
      enabled: true,
      nativeClickable: true,
    });
  });

  it('keeps a disabled unlabeled switch in the accessibility tree', async () => {
    await render(<Switch value disabled onValueChange={jest.fn()} />);

    expect(findNativeViewProps('SwitchView')).toMatchObject({
      enabled: false,
      nativeClickable: true,
    });
  });

  it('makes a labeled row one toggleable switch node', async () => {
    const onValueChange = jest.fn();
    await render(<Switch label="Wi-Fi" value={false} onValueChange={onValueChange} />);

    expect(findModifier('RowView', 'toggleable')).toMatchObject({
      value: false,
      role: 'switch',
      enabled: true,
    });
    // Without a handler, Material drops the 48dp touch size, so the control keeps it explicitly.
    expect(findModifier('SwitchView', 'defaultMinSize')).toMatchObject({
      minWidth: 48,
      minHeight: 48,
    });
    // The inner switch must not be its own interactive node, or the row cannot merge it.
    expect(findNativeViewProps('SwitchView')).toMatchObject({ nativeClickable: false });

    fireToggleable('RowView');
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('reports a disabled labeled row as disabled and ignores toggles', async () => {
    const onValueChange = jest.fn();
    await render(<Switch label="Airplane" value disabled onValueChange={onValueChange} />);

    expect(findModifier('RowView', 'toggleable')).toMatchObject({ value: true, enabled: false });
    expect(findNativeViewProps('SwitchView')).toMatchObject({ enabled: false });

    fireToggleable('RowView');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
