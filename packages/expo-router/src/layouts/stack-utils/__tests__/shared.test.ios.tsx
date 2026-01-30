import { convertStackHeaderSharedPropsToRNSharedHeaderItem } from '../toolbar/shared';
import {
  StackToolbarLabel,
  StackToolbarIcon,
  StackToolbarBadge,
} from '../toolbar/toolbar-primitives';

describe(convertStackHeaderSharedPropsToRNSharedHeaderItem, () => {
  describe('label extraction', () => {
    it('extracts label from StackToolbarLabel child', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarLabel>Test Label</StackToolbarLabel>,
      });
      expect(result.label).toBe('Test Label');
    });

    it('extracts label from string children', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: 'String Label',
      });
      expect(result.label).toBe('String Label');
    });

    it('prefers StackToolbarLabel over string children', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: [<StackToolbarLabel key="label">Label Child</StackToolbarLabel>, 'String Child'],
      });
      expect(result.label).toBe('Label Child');
    });

    it('returns empty string when no label provided', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({});
      expect(result.label).toBe('');
    });

    it('concatenates multiple string children', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: ['Part 1', ' ', 'Part 2'],
      });
      expect(result.label).toBe('Part 1 Part 2');
    });
  });

  describe('icon extraction', () => {
    it('extracts SF Symbol icon from StackToolbarIcon child with sf prop', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarIcon sf="star.fill" />,
      });
      expect(result.icon).toEqual({
        type: 'sfSymbol',
        name: 'star.fill',
      });
    });

    it('extracts image icon from StackToolbarIcon child with src prop', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarIcon src={imageSource} />,
      });
      expect(result.icon).toEqual({
        type: 'image',
        source: imageSource,
        tinted: false,
      });
    });

    it('extracts SF Symbol icon from icon prop (string)', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        icon: 'star.fill',
      });
      expect(result.icon).toEqual({
        type: 'sfSymbol',
        name: 'star.fill',
      });
    });

    it('extracts image icon from icon prop (ImageSourcePropType)', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        icon: imageSource,
      });
      expect(result.icon).toEqual({
        type: 'image',
        source: imageSource,
        tinted: false,
      });
    });

    it('prefers StackToolbarIcon child over icon prop', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarIcon sf="0.circle" />,
        icon: '1.circle',
      });
      expect(result.icon).toEqual({
        type: 'sfSymbol',
        name: '0.circle',
      });
    });

    it('returns undefined when no icon provided', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({});
      expect(result.icon).toBeUndefined();
    });
  });

  describe('iconRenderingMode', () => {
    it('uses explicit template renderingMode from StackToolbarIcon', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarIcon src={imageSource} renderingMode="template" />,
      });
      expect(result.icon).toEqual({
        type: 'image',
        source: imageSource,
        tinted: true,
      });
    });

    it('uses explicit original renderingMode from StackToolbarIcon', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarIcon src={imageSource} renderingMode="original" />,
      });
      expect(result.icon).toEqual({
        type: 'image',
        source: imageSource,
        tinted: false,
      });
    });

    it('uses iconRenderingMode prop when StackToolbarIcon has no renderingMode', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarIcon src={imageSource} />,
        iconRenderingMode: 'template',
      });
      expect(result.icon).toEqual({
        type: 'image',
        source: imageSource,
        tinted: true,
      });
    });

    it('defaults to template when tintColor is set', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        icon: imageSource,
        tintColor: 'blue',
      });
      expect(result.icon).toEqual({
        type: 'image',
        source: imageSource,
        tinted: true,
      });
    });

    it('defaults to original when no tintColor is set', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        icon: imageSource,
      });
      expect(result.icon).toEqual({
        type: 'image',
        source: imageSource,
        tinted: false,
      });
    });

    it('explicit renderingMode overrides tintColor-based default', () => {
      const imageSource = { uri: 'https://example.com/icon.png' };
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarIcon src={imageSource} renderingMode="original" />,
        tintColor: 'blue',
      });
      expect(result.icon).toEqual({
        type: 'image',
        source: imageSource,
        tinted: false,
      });
    });
  });

  describe('badge extraction', () => {
    it('extracts badge value from StackToolbarBadge child', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarBadge>5</StackToolbarBadge>,
      });
      expect(result.badge).toEqual({
        value: '5',
      });
    });

    it('extracts empty badge value', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: <StackToolbarBadge />,
      });
      expect(result.badge).toEqual({
        value: '',
      });
    });

    it('extracts badge with style', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: (
          <StackToolbarBadge style={{ color: 'red', fontSize: 12, fontWeight: 'bold' }}>
            3
          </StackToolbarBadge>
        ),
      });
      expect(result.badge).toEqual({
        value: '3',
        style: { color: 'red', fontSize: 12, fontWeight: 'bold' },
      });
    });

    it('returns undefined badge when no StackToolbarBadge provided', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({});
      expect(result.badge).toBeUndefined();
    });
  });

  describe('style conversion', () => {
    it('converts text style with fontWeight number', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        style: { fontSize: 14, fontWeight: 700 },
      });
      expect(result.labelStyle).toEqual({
        fontSize: 14,
        fontWeight: '700',
      });
    });

    it('converts text style with fontWeight string', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        style: { fontSize: 14, fontWeight: 'bold' },
      });
      expect(result.labelStyle).toEqual({
        fontSize: 14,
        fontWeight: 'bold',
      });
    });

    it('returns undefined labelStyle when no style provided', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({});
      expect(result.labelStyle).toBeUndefined();
    });

    it('handles style array', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        style: [{ fontSize: 14 }, { fontWeight: 'bold' }],
      });
      expect(result.labelStyle).toEqual({
        fontSize: 14,
        fontWeight: 'bold',
      });
    });
  });

  describe('sharesBackground', () => {
    it.each([true, false])(
      'sets sharesBackground as inverse of separateBackground=%s',
      (separateBackground) => {
        const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({ separateBackground });
        expect(result.sharesBackground).toBe(!separateBackground);
      }
    );

    it('defaults sharesBackground to true when separateBackground is undefined', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({});
      expect(result.sharesBackground).toBe(true);
    });
  });

  describe('other props passthrough', () => {
    it('passes through accessibilityLabel', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        accessibilityLabel: 'Test Accessibility',
      });
      expect(result.accessibilityLabel).toBe('Test Accessibility');
    });

    it('passes through accessibilityHint', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        accessibilityHint: 'Test Hint',
      });
      expect(result.accessibilityHint).toBe('Test Hint');
    });

    it.each([true, false, undefined])('passes through disabled=%s', (disabled) => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({ disabled });
      expect(result.disabled).toBe(disabled);
    });

    it('passes through tintColor', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        tintColor: 'blue',
      });
      expect(result.tintColor).toBe('blue');
    });

    it.each([true, false, undefined])(
      'passes through hidesSharedBackground=%s',
      (hidesSharedBackground) => {
        const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({ hidesSharedBackground });
        expect(result.hidesSharedBackground).toBe(hidesSharedBackground);
      }
    );
  });

  describe('combined props', () => {
    it('handles all props together', () => {
      const result = convertStackHeaderSharedPropsToRNSharedHeaderItem({
        children: [
          <StackToolbarLabel key="label">Button Text</StackToolbarLabel>,
          <StackToolbarIcon key="icon" sf="star.fill" />,
          <StackToolbarBadge key="badge" style={{ color: 'white' }}>
            New
          </StackToolbarBadge>,
        ],
        style: { fontSize: 14, fontWeight: 'bold' },
        separateBackground: true,
        accessibilityLabel: 'Star Button',
        tintColor: 'gold',
        disabled: false,
      });

      expect(result).toEqual({
        label: 'Button Text',
        icon: { type: 'sfSymbol', name: 'star.fill' },
        badge: { value: 'New', style: { color: 'white' } },
        labelStyle: { fontSize: 14, fontWeight: 'bold' },
        sharesBackground: false,
        accessibilityLabel: 'Star Button',
        tintColor: 'gold',
        disabled: false,
      });
    });
  });
});
