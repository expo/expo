import * as React from 'react';

export const HeadingsContext = React.createContext();

export default Component => props => (
  <HeadingsContext.Consumer>
    {headingManager => <Component headingManager={headingManager} {...props} />}
  </HeadingsContext.Consumer>
);
