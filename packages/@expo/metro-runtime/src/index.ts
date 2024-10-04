import './location/install';

// Ensure this is removed in production.
// TODO: Enable in production.
if (process.env.NODE_ENV !== 'production') {
  // IMPORT POSITION MATTERS FOR FAST REFRESH ON WEB
  require('./effects');
  // vvv EVERYTHING ELSE vvv
  require('./async-require');
}
