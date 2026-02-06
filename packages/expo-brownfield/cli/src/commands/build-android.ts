import type { Command } from 'commander';

const buildAndroid = async (command: Command) => {
  console.log(command.opts());
};

export default buildAndroid;
