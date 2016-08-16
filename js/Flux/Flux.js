/**
 * @providesModule Flux
 */
'use strict';

import mapValues from 'lodash/mapValues';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { createAction } from 'redux-actions';
import promiseMiddleware from 'redux-promise';

export default class Flux {
  static createStore(reducers) {
    let createExponentStore = applyMiddleware(promiseMiddleware)(createStore);
    return createExponentStore(combineReducers(reducers));
  }

  static createActions(actionCreators) {
    return mapValues(actionCreators, (actionCreator, name) => {
      return createAction(name, actionCreator);
    });
  }

  static getActionTypes(actionCreators) {
    return mapValues(actionCreators, (createAction, name) => name);
  }

  static createReducer(initialState, actionHandlers) {
    return function(state = initialState, action) {
      let actionHandler = actionHandlers[action.type];
      if (actionHandler == null) {
        return state;
      }

      if (typeof actionHandler === 'function') {
        return actionHandler(state, action);
      }

      // Assume the action handler is a map of handlers
      let {
        begin: optimisticHandler,
        then: successHandler,
        catch: errorHandler,
        end: completionHandler,
      } = actionHandler;

      if (action.sequence.type === 'start') {
        return optimisticHandler ? optimisticHandler(state, action) : state;
      }

      if (completionHandler) {
        if (successHandler || errorHandler) {
          console.error(
            'You have set an "end" handler and a "then" or "catch" handler. ' +
            'The "end" handler is exclusive to the other two and takes ' +
            'precedence over them. Your other handlers will not be invoked.'
          );
        }
        return completionHandler(state, action);
      }

      if (!action.error) {
        return successHandler ? successHandler(state, action) : state;
      }

      if (errorHandler) {
        return errorHandler(state, action);
      }

      let error = action.payload;
      console.error(`The action "${action.type}" failed:`, error.stack);
      return state;
    };
  }
}

export function action(target, name, descriptor) {
  descriptor.value = createAction(name, descriptor.value);
  return descriptor;
}
