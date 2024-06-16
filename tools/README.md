# Expotools
A set of commands and libraries for working within the Expo repository.

Expotools is a CLI and library that contains internal Expo tooling. It is used as a library in CI and as a CLI to:
  - Test and develop CI locally
  - Run tests locally
  - Assist with the release process

## Prerequisites

Run `bundle install` in the root to install all required Ruby gems.

## Usage
Run `expotools` or `et` from the Expo repository to run the latest version of expotools. This automatically rebuilds the code according to the latest sources.

For example, running `et --help` will display all the available commands.

## Development
Build the code once using `yarn build`.

`yarn watch` will watch for code changes and rebuild the code each time you save. The standard workflow for developing expotools is to leave `yarn watch` open in one tab and run `./bin/expotools COMMAND` in the other. Running `./bin/expotools` avoids the update check that happens when calling `expotools` or `et`.
