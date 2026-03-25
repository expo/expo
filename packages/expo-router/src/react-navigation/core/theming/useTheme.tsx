import * as React from 'react';

import { ThemeContext } from './ThemeContext';

export function useTheme() {
  const theme = React.useContext(ThemeContext);

  if (theme == null) {
    throw new Error(
      "Couldn't find a theme. Is your component inside NavigationContainer or does it have a theme?"
    );
  }

  return theme;
}
