/**
 * @providesModule AccountReducer
 */
'use strict';

import AccountActions from 'AccountActions';
import Flux from 'Flux';
import { Record } from 'immutable';

const AccountActionTypes = Flux.getActionTypes(AccountActions);
const AccountState = Record({
  email: null,
  skipRegistration: null,
});

export default Flux.createReducer(new AccountState(), {
  [AccountActionTypes.setAccount](state, action) {
    let { email, skipRegistration } = action.payload;
    return state.merge({ email, skipRegistration });
  },

  [AccountActionTypes.registerAccountAsync]: {
    then(state, action) {
      let { email } = action.payload;
      return state.merge({ email });
    },
  },
});
