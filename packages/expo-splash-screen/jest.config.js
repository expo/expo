/** @type {import('jest').Config} */
module.exports = {
  projects: [{ testRegex: '/__tests__/.*(test|spec)\\.[jt]sx?$', clearMocks: true }],
};
