import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Provider as ReduxProvider } from 'react-redux';

import ApolloClient from './api/ApolloClient';
import HomeApp from './HomeApp';
import Store from './redux/Store';

export default class App extends React.Component {
  render() {
    return (
      <ReduxProvider store={Store}>
        <ApolloProvider client={ApolloClient}>
          <HomeApp {...this.props} />
        </ApolloProvider>
      </ReduxProvider>
    );
  }
}
