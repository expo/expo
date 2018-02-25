/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule SessionReducer
 */
'use strict';

import SessionActions from 'SessionActions';
import Flux from 'Flux';
import { Record } from 'immutable';

const SessionActionTypes = Flux.getActionTypes(SessionActions);

const SessionState = Record({
  sessionSecret: null,
});

export default Flux.createReducer(
  new SessionState(),
  {
    [SessionActionTypes.setSession](state, action) {
      return new SessionState(action.payload);
    },
    [SessionActionTypes.signOutAsync]() {
      return new SessionState();
    },
  },
  'sessionReducer'
);
