import './location/install';
// IMPORT POSITION MATTERS FOR FAST REFRESH ON WEB
import './effects';
// Ensure this is removed in production.
// TODO: Enable in production.
if (process.env.NODE_ENV !== 'production') {
    // vvv EVERYTHING ELSE vvv
    require('./async-require');
}
//# sourceMappingURL=index.js.map