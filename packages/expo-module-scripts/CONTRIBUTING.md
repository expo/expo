## Test with both Yarn and npm

While Yarn is required to install packages in the Expo repo, we use npm to publish packages. For scripts that run when publishing, make sure to test them with both Yarn and npm.

One significant difference is that Yarn adds the workspace root and package's .bin directories to `PATH`. We need to do the same for npm so that it finds installed scripts in the same places. A simple way to do this is to run commands with `yarn exec` to let Yarn augment `PATH` before executing the given command.
