import * as React from 'react';

import { HeaderHeightContext } from './HeaderHeightContext';

export function useHeaderHeight() {
  const height = React.useContext(HeaderHeightContext);

  if (height === undefined) {
    throw new Error(
      "Couldn't find the header height. Are you inside a screen in a navigator with a header?"
    );
  }

  return height;
}
