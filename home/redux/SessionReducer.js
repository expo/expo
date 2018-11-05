import SessionActions from './SessionActions';
import { Record } from 'immutable';

const SessionState = Record({
  sessionSecret: null,
});

export default (state, action) => {
  switch (action.type) {
  case 'setSession':
    return new SessionState(action.payload);
  case 'signOut':
    return new SessionState();
  default:
    return (state) ? state : new SessionState();
  }
};
