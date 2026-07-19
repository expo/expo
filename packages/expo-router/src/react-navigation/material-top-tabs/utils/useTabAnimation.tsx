import * as React from 'react';

import { TabAnimationContext } from './TabAnimationContext';

export function useTabAnimation() {
  const animation = React.useContext(TabAnimationContext);

  if (animation === undefined) {
    throw new Error(
      "Couldn't find values for tab animation. Are you inside a screen in Material Top Tab navigator?"
    );
  }

  return animation;
}
