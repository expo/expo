"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCI = void 0;
/**
 * Determine if the package manager is running in a CI environment.
 * @see https://github.com/watson/ci-info/blob/19fa9027ae0588b80121ef78d2b18100fb886b0e/index.js#L56-L66
 */
function isCI() {
    return !!(process.env.CI || // Travis CI, CircleCI, Cirrus CI, Gitlab CI, Appveyor, CodeShip, dsari
        process.env.CONTINUOUS_INTEGRATION || // Travis CI, Cirrus CI
        process.env.BUILD_NUMBER || // Jenkins, TeamCity
        process.env.CI_APP_ID || // Appflow
        process.env.CI_BUILD_ID || // Appflow
        process.env.CI_BUILD_NUMBER || // Appflow
        process.env.RUN_ID || // TaskCluster, dsari
        false);
}
exports.isCI = isCI;
//# sourceMappingURL=env.js.map