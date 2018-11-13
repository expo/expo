import * as React from 'react';

export const SluggerContext = React.createContext();

export default Component => props => (
  <SluggerContext.Consumer>
    {sluggerInstance => <Component slugger={sluggerInstance} {...props} />}
  </SluggerContext.Consumer>
);
