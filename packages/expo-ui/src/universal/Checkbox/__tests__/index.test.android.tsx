import { render } from '@testing-library/react-native';

import { Checkbox } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';

jest.mock('expo');

function findModifier(viewName: string, type: string) {
  return findNativeViewProps(viewName)?.modifiers?.find((m: any) => m.$type === type);
}

function fireToggleable(viewName: string) {
  findNativeViewProps(viewName).onGlobalEvent({ nativeEvent: { payload: ['toggleable', {}] } });
}

describe('Checkbox', () => {
  it('keeps the checkbox as the interactive node without a label', async () => {
    await render(<Checkbox value={false} onValueChange={jest.fn()} />);

    expect(findNativeViewProps('RowView')).toBeUndefined();
    expect(findNativeViewProps('CheckboxView')).toMatchObject({ nativeClickable: true });
  });

  it('keeps a disabled unlabeled checkbox in the accessibility tree', async () => {
    await render(<Checkbox value disabled onValueChange={jest.fn()} />);

    expect(findNativeViewProps('CheckboxView')).toMatchObject({
      enabled: false,
      nativeClickable: true,
    });
  });

  it('makes a labeled row one toggleable checkbox node', async () => {
    const onValueChange = jest.fn();
    await render(<Checkbox label="Accept terms" value={false} onValueChange={onValueChange} />);

    expect(findModifier('RowView', 'clickable')).toBeUndefined();
    expect(findModifier('RowView', 'toggleable')).toMatchObject({
      value: false,
      role: 'checkbox',
      enabled: true,
    });
    // Without a handler, Material drops the 48dp touch size, so the control keeps it explicitly.
    expect(findModifier('CheckboxView', 'defaultMinSize')).toMatchObject({
      minWidth: 48,
      minHeight: 48,
    });
    expect(findNativeViewProps('CheckboxView')).toMatchObject({ nativeClickable: false });

    fireToggleable('RowView');
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('reports a disabled labeled row as disabled and ignores toggles', async () => {
    const onValueChange = jest.fn();
    await render(<Checkbox label="Locked" value disabled onValueChange={onValueChange} />);

    expect(findModifier('RowView', 'toggleable')).toMatchObject({ value: true, enabled: false });
    expect(findNativeViewProps('CheckboxView')).toMatchObject({ enabled: false });

    fireToggleable('RowView');
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
