import * as React from 'react';

export const HeadingsContext = React.createContext();

const withHeadingManager = Component => props => (
  <HeadingsContext.Consumer>
    {headingManager => <Component headingManager={headingManager} {...props} />}
  </HeadingsContext.Consumer>
);

export default withHeadingManager;
