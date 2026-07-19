'use strict';

const { name } = require('./package.json');

throw new Error(
  `Importing ${name} is not supported. The purpose of this package is to define common scripts for developing Expo module packages.`
);
