import { render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';

import { appendStackScreenTitlePropsToOptions } from '../screen/StackScreenTitle';

describe(appendStackScreenTitlePropsToOptions, () => {
  describe('title from children', () => {
    it('sets title from string children', () => {
      const result = appendStackScreenTitlePropsToOptions({}, { children: 'Page Title' });
      expect(result.title).toBe('Page Title');
    });

    it('does not set headerTitle when not using asChild', () => {
      const result = appendStackScreenTitlePropsToOptions({}, { children: 'Page Title' });
      expect(result.headerTitle).toBeUndefined();
    });
  });

  describe('asChild', () => {
    it('sets headerTitle as function when asChild is true', () => {
      const CustomTitle = <Text>Custom Title</Text>;
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { asChild: true, children: CustomTitle }
      );
      expect(result.headerTitle).toBeDefined();
      expect(typeof result.headerTitle).toBe('function');

      if (typeof result.headerTitle !== 'function')
        throw new Error('headerTitle is not a function');

      expect(
        render(<>{result.headerTitle({ children: '' })}</>).getByText('Custom Title')
      ).toBeDefined();
    });
  });

  describe('asChild/children type mismatch warnings', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    beforeEach(() => {
      consoleSpy.mockClear();
    });

    afterAll(() => {
      consoleSpy.mockRestore();
    });

    it('warns when asChild is true but children is string', () => {
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { asChild: true, children: 'String Title' }
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "Stack.Screen.Title: 'asChild' expects a custom component as children, string received."
      );
      // Should reset titleOptions to empty
      expect(result.title).toBeUndefined();
      expect(result.headerTitle).toBeUndefined();
    });

    it('warns when asChild is false but children is component', () => {
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { asChild: false, children: <Text>Component</Text> }
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Stack.Screen.Title: Component passed to Stack.Screen.Title without `asChild` enabled. In order to render a custom component as the title, set `asChild` to true.'
      );
      // Should reset titleOptions to empty
      expect(result.title).toBeUndefined();
      expect(result.headerTitle).toBeUndefined();
    });

    it('warns when asChild is not set but children is component', () => {
      const result = appendStackScreenTitlePropsToOptions({}, { children: <Text>Component</Text> });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Stack.Screen.Title: Component passed to Stack.Screen.Title without `asChild` enabled. In order to render a custom component as the title, set `asChild` to true.'
      );
      // Should reset titleOptions to empty
      expect(result.title).toBeUndefined();
      expect(result.headerTitle).toBeUndefined();
    });

    it('does not warn for valid combinations', () => {
      appendStackScreenTitlePropsToOptions({}, { children: 'String Title' });
      appendStackScreenTitlePropsToOptions({}, { asChild: true, children: <Text>Component</Text> });

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('large prop', () => {
    it.each([true, false, undefined])('sets headerLargeTitle to %s when large is %s', (large) => {
      const result = appendStackScreenTitlePropsToOptions({}, { large, children: 'Title' });
      expect(result.headerLargeTitle).toBe(large);
    });
  });

  describe('style prop', () => {
    it('converts fontWeight number to string', () => {
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { children: 'Title', style: { fontWeight: 700 as unknown as '700' } }
      );
      const flattenedStyle = StyleSheet.flatten(result.headerTitleStyle);
      expect(flattenedStyle?.fontWeight).toBe('700');
    });

    it('keeps fontWeight string as is', () => {
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { children: 'Title', style: { fontWeight: 'bold' } }
      );
      const flattenedStyle = StyleSheet.flatten(result.headerTitleStyle);
      expect(flattenedStyle?.fontWeight).toBe('bold');
    });

    it('passes through other style properties', () => {
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { children: 'Title', style: { fontSize: 18, fontFamily: 'Helvetica' } }
      );
      expect(result.headerTitleStyle).toMatchObject({
        fontSize: 18,
        fontFamily: 'Helvetica',
      });
    });

    it.each(['center', 'left'] as const)('sets headerTitleAlign to %s from textAlign', (align) => {
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { children: 'Title', style: { textAlign: align } }
      );
      expect(result.headerTitleAlign).toBe(align);
    });
  });

  describe('largeStyle prop', () => {
    it('converts fontWeight number to string for large style', () => {
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { children: 'Title', largeStyle: { fontWeight: 600 as unknown as '600' } }
      );
      const flattenedStyle = StyleSheet.flatten(result.headerLargeTitleStyle);
      expect(flattenedStyle?.fontWeight).toBe('600');
    });

    it('keeps fontWeight string as is for large style', () => {
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { children: 'Title', largeStyle: { fontWeight: 'semibold' } }
      );
      const flattenedStyle = StyleSheet.flatten(result.headerLargeTitleStyle);
      expect(flattenedStyle?.fontWeight).toBe('semibold');
    });

    it('passes through other large style properties', () => {
      const result = appendStackScreenTitlePropsToOptions(
        {},
        { children: 'Title', largeStyle: { fontSize: 34, color: 'black' } }
      );
      expect(result.headerLargeTitleStyle).toMatchObject({
        fontSize: 34,
        color: 'black',
      });
    });
  });

  describe('options merging', () => {
    it('merges with existing options', () => {
      const existingOptions = { headerShown: true, headerStyle: { backgroundColor: 'white' } };
      const result = appendStackScreenTitlePropsToOptions(existingOptions, { children: 'Title' });
      expect(result.headerShown).toBe(true);
      expect(result.headerStyle).toEqual({ backgroundColor: 'white' });
      expect(result.title).toBe('Title');
    });

    it('overwrites conflicting options', () => {
      const existingOptions = { title: 'Old Title' };
      const result = appendStackScreenTitlePropsToOptions(existingOptions, {
        children: 'New Title',
      });
      expect(result.title).toBe('New Title');
    });
  });
});
