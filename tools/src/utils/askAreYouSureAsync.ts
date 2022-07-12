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
  // Alternate implementation below
  /*
  const choices = ['Yes', 'No'];
  const { selection } = await inquirer.prompt<{ selection: string }>([
    {
      type: 'list',
      name: 'selection',
      message: 'Are you sure?',
      choices,
      default: 'No',
    },
  ]);
  return selection === 'Yes';
   */
}
