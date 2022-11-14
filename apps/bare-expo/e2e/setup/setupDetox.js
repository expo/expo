const { launchWithPermissionsAsync } = require('../Utils');

const permissions = {
  calendar: true,
  contacts: true,
  medialibrary: true,
  microphone: true,
  motion: true,
  notifications: true,
  photos: true,
  reminders: true,
  speech: true,
  // location: 'always', // inuse, never, unset
  // camera: true,
  // faceid: true,
  // homekit: true,
  // siri: true,
  // // (iOS 12.0 and above)
  // health: true,
};

beforeAll(async () => {
  await launchWithPermissionsAsync(permissions);
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
