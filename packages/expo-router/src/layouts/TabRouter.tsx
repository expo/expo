'use client';
import { type NavigationAction, type StackActionType } from '@react-navigation/native';
import type { ComponentProps } from 'react';

import type { BottomTabNavigator } from './TabsClient';

export const tabRouterOverride: NonNullable<
  ComponentProps<BottomTabNavigator>['UNSTABLE_router']
> = (original) => {
  return {
    ...original,
    getStateForAction: (state, action, options) => {
      if (action.target && action.target !== state.key) {
        return null;
      }

      if (isReplaceAction(action)) {
        // Generate the state as if we were using JUMP_TO
        let nextState = original.getStateForAction(
          state,
          {
            ...action,
            type: 'JUMP_TO',
          },
          options
        );

        if (!nextState || nextState.index === undefined || !Array.isArray(nextState.history)) {
          return null;
        }

        // If the state is valid and we didn't JUMP_TO a single history state,
        // then remove the previous state.
        if (nextState.index !== 0) {
          const previousIndex = nextState.index - 1;

          nextState = {
            ...nextState,
            key: `${nextState.key}-replace`,
            // Omit the previous history entry that we are replacing
            history: [
              ...nextState.history.slice(0, previousIndex),
              ...nextState.history.splice(nextState.index),
            ],
          };
        }

        return nextState;
      }

      return original.getStateForAction(state, action, options);
    },
  };
};

function isReplaceAction(
  action: NavigationAction
): action is Extract<StackActionType, { type: 'REPLACE' }> {
  return action.type === 'REPLACE';
}
