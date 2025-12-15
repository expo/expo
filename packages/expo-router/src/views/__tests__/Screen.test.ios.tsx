import { screen } from '@testing-library/react-native';
import { View } from 'react-native';

import Stack from '../../layouts/Stack';
import { renderRouter } from '../../testing-library';

describe('Screen', () => {
  it('should throw an error when name is set outside of a Layout', () => {
    expect(() =>
      renderRouter({
        _layout: () => <Stack />,
        index: () => <Stack.Screen name="index" />,
      })
    ).toThrow(
      `The name prop on the Screen component may only be used when it is inside a Layout route`
    );
  });
  it('should throw an error when name is set outside of a Layout, even when options are provided', () => {
    expect(() =>
      renderRouter({
        _layout: () => <Stack />,
        index: () => <Stack.Screen name="index" options={{ title: 'Test Title' }} />,
      })
    ).toThrow(
      `The name prop on the Screen component may only be used when it is inside a Layout route`
    );
  });

  it('should not throw an error when name is set inside a Layout', () => {
    expect(() =>
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Screen name="index" />
          </Stack>
        ),
        index: () => <View />,
      })
    ).not.toThrow();
  });

  it('should not throw an error when name is set inside a protected route with a true guard', () => {
    expect(() =>
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Protected guard>
              <Stack.Screen name="index" />
            </Stack.Protected>
          </Stack>
        ),
        index: () => <View testID="index" />,
      })
    ).not.toThrow();

    expect(screen.getByTestId('index')).toBeVisible();
  });

  it('should not throw an error when name is set inside a protected route with a false guard', () => {
    expect(() =>
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Protected guard={false}>
              <Stack.Screen name="index" />
            </Stack.Protected>
          </Stack>
        ),
        index: () => <View testID="index" />,
        _sitemap: () => <View testID="sitemap" />,
      })
    ).not.toThrow();

    expect(screen.getByTestId('sitemap')).toBeVisible();
  });

  it('should set options when used inside a Layout', () => {
    const headerTitle = jest.fn(() => null);
    renderRouter({
      _layout: () => (
        <Stack screenOptions={{ headerTitle }}>
          <Stack.Screen name="index" options={{ title: 'Test Title' }} />
        </Stack>
      ),
      index: () => <View />,
    });

    expect(headerTitle).toHaveBeenCalledTimes(2);
    expect(headerTitle.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        children: 'Test Title',
      })
    );
    expect(headerTitle.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        children: 'Test Title',
      })
    );
  });
  it('should set options when used inside a Screen', () => {
    const headerTitle = jest.fn(() => null);
    renderRouter({
      _layout: () => <Stack screenOptions={{ headerTitle }} />,
      index: () => <Stack.Screen options={{ title: 'Test Title' }} />,
    });

    expect(headerTitle).toHaveBeenCalledTimes(2);
    expect(headerTitle.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        children: 'index',
      })
    );
    expect(headerTitle.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        children: 'Test Title',
      })
    );
  });
});
