import * as React from 'react';

import { HeadingManager } from '~/common/headingManager';

export const HeadingsContext = React.createContext<HeadingManager | null>(null);

const withHeadingManager =
  <P extends object>(Component: React.ComponentType<P & { headingManager: HeadingManager }>) =>
  (props: P) =>
    (
      <HeadingsContext.Consumer>
        {headingManager => <Component headingManager={headingManager!} {...props} />}
      </HeadingsContext.Consumer>
    );

export default withHeadingManager;
