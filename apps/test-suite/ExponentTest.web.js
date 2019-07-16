export default {
  get isInCI() {
    return process.env.CI;
  },
  log: console.log,
  completed() {
    // noop
  },
  action() {
    // noop
  },
};
