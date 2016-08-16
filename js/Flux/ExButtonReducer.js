/**
 * @providesModule ExButtonReducer
 */
'use strict';

import ExButtonActions from 'ExButtonActions';
import Flux from 'Flux';
import { Record } from 'immutable';

const ExButtonActionTypes = Flux.getActionTypes(ExButtonActions);

const ExButtonState = Record({
  isVisible: true,
});

export default Flux.createReducer(new ExButtonState(), {
  [ExButtonActionTypes.showExponentButton](state, action) {
    return state.set('isVisible', true);
  },

  [ExButtonActionTypes.hideExponentButton](state, action) {
    return state.set('isVisible', false);
  },
});
