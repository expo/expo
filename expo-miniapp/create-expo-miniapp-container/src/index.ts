#!/usr/bin/env node
import chalk from 'chalk';
import arg from 'arg';
import prompts from 'prompts';
import { createMiniAppContainer } from './create';

const packageJson = require('../package.json');

async function main() {
  const args = arg({
    // Options
    '--help': Boolean,
    '--version': Boolean,
    '--template': String,
    '--yes': Boolean,

    // Aliases
    '-h': '--help',
    '-v': '--version',
    '-y': '--yes',
  });

  if (args['--version']) {
    console.log(packageJson.version);
    return;
  }

  if (args['--help']) {
    printHelp();
    return;
  }

  // Get project name from args
  const projectName = args._[0];

  console.log(chalk.bold.cyan('\n🚀 Create Expo MiniApp Container\n'));

  let name = projectName;

  // If no project name, prompt for it
  if (!name && !args['--yes']) {
    const response = await prompts({
      type: 'text',
      name: 'name',
      message: 'What is your project named?',
      initial: 'my-miniapp-container',
      validate: (value) => {
        if (!value) return 'Project name is required';
        if (!/^[a-z0-9-]+$/.test(value)) {
          return 'Project name must contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      },
    });

    if (!response.name) {
      console.log(chalk.red('\n❌ Project creation cancelled'));
      process.exit(1);
    }

    name = response.name;
  }

  if (!name) {
    console.error(chalk.red('❌ Project name is required'));
    process.exit(1);
  }

  try {
    await createMiniAppContainer({
      projectName: name,
      template: args['--template'] || 'default',
      skipPrompts: args['--yes'] || false,
    });

    console.log(chalk.bold.green('\n✅ MiniApp Container created successfully!\n'));
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.gray(`  cd ${name}`));
    console.log(chalk.gray('  npm install'));
    console.log(chalk.gray('  npx expo run:android'));
    console.log(chalk.gray('  # or'));
    console.log(chalk.gray('  npx expo run:ios'));
    console.log();
  } catch (error: any) {
    console.error(chalk.red(`\n❌ Error creating project: ${error.message}`));
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
${chalk.bold('Usage:')}
  ${chalk.cyan('npx create-expo-miniapp-container')} ${chalk.yellow('[project-name]')} ${chalk.gray('[options]')}

${chalk.bold('Options:')}
  -h, --help              Show this help message
  -v, --version           Show version number
  -y, --yes               Skip all prompts and use default values
  --template <name>       Use a specific template (default: 'default')

${chalk.bold('Examples:')}
  ${chalk.gray('# Create with interactive prompts')}
  ${chalk.cyan('npx create-expo-miniapp-container')}

  ${chalk.gray('# Create with a specific name')}
  ${chalk.cyan('npx create-expo-miniapp-container my-container')}

  ${chalk.gray('# Skip prompts')}
  ${chalk.cyan('npx create-expo-miniapp-container my-container --yes')}
`);
}

main().catch((error) => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});
