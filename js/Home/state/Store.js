import { applyMiddleware, combineReducers, createStore, compose } from 'redux';
import { effectsMiddleware } from 'redux-effex';
import ApolloClient from '../api/ApolloClient';

import Reducers from './reducers';
import Effects from './effects';

export default createStore(
  combineReducers(Reducers),
  {},
  applyMiddleware(
    effectsMiddleware(Effects),
    ApolloClient.middleware()
  )
);
