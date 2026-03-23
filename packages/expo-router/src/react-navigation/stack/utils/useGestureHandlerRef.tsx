import * as React from 'react';

import { GestureHandlerRefContext } from './GestureHandlerRefContext';

export function useGestureHandlerRef() {
  const ref = React.useContext(GestureHandlerRefContext);

  if (ref === undefined) {
    throw new Error(
      "Couldn't find a ref for gesture handler. Are you inside a screen in Stack?"
    );
  }

  return ref;
}
