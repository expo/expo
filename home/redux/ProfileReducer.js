import { Record } from 'immutable';
import LocalStorage from '../storage/LocalStorage';

const ProfileState = Record({
  image: null,
});

export default (state, action) => {
  switch (action.type) {
    case 'setImage': {
      return state.merge({
        image: action.payload.url,
      });
    }
    case 'clearImage': {
      return state.merge({
        image: null,
      });
    }
    default:
      return state ? state : new ProfileState();
  }
};
