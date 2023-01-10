const spawnAsync = require('@expo/spawn-async');

const commandRunner = async (command, params = [], processCwd = false) => {
  return await spawnAsync(command, params, {
    stdio: 'inherit',
    cwd: processCwd ? process.cwd() : undefined,
  }).catch((e) => {
    process.exit(e.status);
  });
};

const getArgs = () => process.argv.splice(2);

module.exports = { commandRunner, getArgs };
