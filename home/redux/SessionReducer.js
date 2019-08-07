import { Record } from 'immutable';

const SessionState = Record({
  sessionSecret: null,
});

export default (state = new SessionState(), action) => {
  switch (action.type) {
    case 'setSession':
      return new SessionState(action.payload);
    case 'signOut':
      return new SessionState();
    default:
      return state;
  }
};
