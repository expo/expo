import * as React from 'react';

export const SluggerContext = React.createContext();

const withSlugger = (Component) => {
  const SluggerHOC = props => (
    <SluggerContext.Consumer>
      {sluggerInstance => <Component slugger={sluggerInstance} {...props} />}
    </SluggerContext.Consumer>
  );

  return SluggerHOC;
};

export default withSlugger;
