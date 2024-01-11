import { Record } from 'immutable';

export type SessionObject = {
  sessionSecret: string | null;
};

export type SessionType = Record<SessionObject> & Readonly<SessionObject>;

const SessionState = Record<SessionObject>({
  sessionSecret: null,
});

type SessionActions =
  | {
      type: 'setSession';
      payload: SessionObject;
    }
  | { type: 'signOut' };

export default (state: SessionType = new SessionState(), action: SessionActions): SessionType => {
  switch (action.type) {
    case 'setSession':
      return new SessionState(action.payload);
    case 'signOut':
      return new SessionState();
    default:
      return state;
  }
};
