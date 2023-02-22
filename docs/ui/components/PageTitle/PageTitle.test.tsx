import { render, screen } from '@testing-library/react';

import { PageTitle } from './PageTitle';

describe('PageTitle', () => {
  test('displays npm registry link', () => {
    render(<PageTitle title="test-title" packageName="expo-av" />);
    expect(screen.getByRole('link').getAttribute('href')).toEqual(
      'https://www.npmjs.com/package/expo-av'
    );
    screen.getByTitle('View package in npm Registry');
  });

  test('displays GitHub source code link', () => {
    render(
      <PageTitle
        title="test-title"
        packageName="expo-av"
        sourceCodeUrl="https://github.com/expo/expo/tree/main/packages/expo-av"
      />
    );
    screen.getByTitle('View source code of expo-av on GitHub');
  });
});
