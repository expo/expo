import getenv from 'getenv';

export default {
  get isInCI() {
    return getenv.boolish('CI', false);
  },
  log: console.log,
  completed() {
    // noop
  },
  action() {
    // noop
  },
};
