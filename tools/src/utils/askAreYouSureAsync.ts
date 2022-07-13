import inquirer from 'inquirer';

export default async function askAreYouSureAsync(): Promise<boolean> {
  const { selection } = await inquirer.prompt<{ selection: boolean }>([
    {
      type: 'confirm',
      name: 'selection',
      default: false,
      message: 'Are you sure?',
    },
  ]);
  return selection;
}
