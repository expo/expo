import type { Command } from 'commander';

const buildIos = async (command: Command) => {
  console.log(command.opts());
};

export default buildIos;
