import commander from 'commander';

import CreateProject from './commands/CreateProject';
import RunTest from './commands/RunTest';

const program = commander.version('0.0.1');
[CreateProject, RunTest].forEach((command) => command(program));

program.parse(process.argv);
