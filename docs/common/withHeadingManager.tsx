import { PropsWithChildren, createContext, ComponentType } from 'react';

import { HeadingManager } from '~/common/headingManager';

export const HeadingsContext = createContext<HeadingManager | null>(null);

export type HeadingManagerProps = { headingManager: HeadingManager };

const withHeadingManager =
  <P extends object>(Component: ComponentType<PropsWithChildren<P & HeadingManagerProps>>) =>
  (props: PropsWithChildren<P>) => (
    <HeadingsContext.Consumer>
      {headingManager => <Component headingManager={headingManager!} {...props} />}
    </HeadingsContext.Consumer>
  );

export default withHeadingManager;
