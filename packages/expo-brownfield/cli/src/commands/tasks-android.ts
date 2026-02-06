import type { Command } from 'commander';

const tasksAndroid = async (command: Command) => {
  console.log(command.opts());
};

export default tasksAndroid;
