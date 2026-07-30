import { render } from '@testing-library/react-native';

import { Button } from '..';
import { findNativeViewProps } from '../../../__mocks__/expo';
import { buttonStyle, controlSize } from '../../../swift-ui/modifiers';

jest.mock('expo');

function nativeButtonModifiers() {
  return findNativeViewProps('Button')?.modifiers;
}

describe('Button', () => {
  it('maps the variant prop to a buttonStyle modifier', () => {
    render(<Button label="Tap" variant="outlined" />);
    expect(nativeButtonModifiers()).toEqual([{ $type: 'buttonStyle', style: 'bordered' }]);
  });

  it('defaults to the filled variant', () => {
    render(<Button label="Tap" />);
    expect(nativeButtonModifiers()).toEqual([{ $type: 'buttonStyle', style: 'borderedProminent' }]);
  });

  it('does not inject the variant buttonStyle when the user supplies a buttonStyle modifier', () => {
    render(<Button label="Tap" modifiers={[buttonStyle('glassProminent')]} />);
    expect(nativeButtonModifiers()).toEqual([{ $type: 'buttonStyle', style: 'glassProminent' }]);
  });

  it('prefers a user buttonStyle modifier over the variant prop', () => {
    render(<Button label="Tap" variant="text" modifiers={[buttonStyle('automatic')]} />);
    expect(nativeButtonModifiers()).toEqual([{ $type: 'buttonStyle', style: 'automatic' }]);
  });

  it('keeps the variant buttonStyle when the user supplies unrelated modifiers', () => {
    render(<Button label="Tap" variant="text" modifiers={[controlSize('large')]} />);
    expect(nativeButtonModifiers()).toEqual([
      { $type: 'buttonStyle', style: 'plain' },
      { $type: 'controlSize', size: 'large' },
    ]);
  });
});
