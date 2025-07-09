import { Command } from '@expo/commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';

import Git, { GitLog } from '../Git';
import logger from '../Logger';

type ActionOptions = {
  from?: string;
  to?: string;
  startDate?: string;
  startAtLatest: boolean;
  dry: boolean;
};

export default (program: Command) => {
  program
    .command('cherry-pick [packageNames...]')
    .alias('cherrypick', 'cpk')
    .option(
      '-f, --from <string>',
      'Source branch of commits to cherry-pick. Defaults to the current branch if `--to` is specified, and `main` otherwise.'
    )
    .option(
      '-t, --to <string>',
      'Destination branch for commits to cherry-pick. Defaults to the current branch.'
    )
    .option(
      '-s, --start-date <string>',
      'Date at which to start looking for commits to cherry-pick, ignoring any earlier commits. Format: YYYY-MM-DD'
    )
    .option(
      '--start-at-latest',
      'Equivalent to `--start-date <latest-date>`, where `latest-date` is the author date of the most recent commit on the destination branch across all specified packages.',
      false
    )
    .option(
      '-d, --dry',
      'Dry run. Does not run any commands that actually modify the repository, and logs them instead',
      false
    )
    .description(
      'Interactively creates and runs a command to cherry pick commits in a specific package (or set of packages) from one branch to another.'
    )
    .asyncAction(main);
};

async function main(packageNames: string[], options: ActionOptions): Promise<void> {
  if (!options.dry && (await Git.hasUnstagedChangesAsync())) {
    throw new Error(
      'Cannot run this command with unstaged changes. Try again with a clean working directory.'
    );
  }

  const currentBranch = await Git.getCurrentBranchNameAsync();
  if (!options.from && !options.to && currentBranch === 'main') {
    throw new Error('Must specify either `--from` or `--to` branch if main is checked out.');
  }
  const source = options.from ?? (options.to ? currentBranch : 'main');
  const destination = options.to ?? currentBranch;
  if (source === destination) {
    throw new Error(
      'Source and destination branches cannot be the same. Try specifying both `--from` and `--to`.'
    );
  }

  if (options.startAtLatest && options.startDate) {
    throw new Error('Cannot specify both `--start-date` and `--start-at-latest`.');
  }

  logger.info(
    `\nLooking for commits to cherry-pick from ${chalk.bold(chalk.blue(source))} to ${chalk.bold(
      chalk.blue(destination)
    )}...\n`
  );

  const packagePaths = packageNames.map((packageName) => path.join('.', 'packages', packageName));

  const mergeBase = await Git.mergeBaseAsync(source, destination);
  const commitsOnDestinationBranch = await Git.logAsync({
    fromCommit: mergeBase,
    toCommit: destination,
    paths: packagePaths,
  });

  let startDate: Date | null = null;
  if (options.startDate) {
    startDate = new Date(options.startDate);
  } else if (options.startAtLatest) {
    startDate = new Date(commitsOnDestinationBranch[0].authorDate);
  }

  const commitsBeforeStartDate: GitLog[] = [];
  const candidateCommits = (
    await Git.logAsync({
      fromCommit: source,
      toCommit: destination,
      paths: packagePaths,
      cherryPick: 'left',
      symmetricDifference: true,
    })
  )
    .reverse()
    .filter((srcCommit) => {
      // Git will sometimes return commits that have already been cherry-picked if the diff is
      // slightly different. We filter them out here if the commit name/date/author matches
      // another commit already on the destination branch.
      const hasAlreadyBeenCherryPicked = commitsOnDestinationBranch.some(
        (destCommit) =>
          srcCommit.authorDate === destCommit.authorDate &&
          srcCommit.authorName === destCommit.authorName &&
          srcCommit.title === destCommit.title
      );
      if (hasAlreadyBeenCherryPicked) {
        return false;
      }

      // Filter out any commits earlier than the startDate (if we have one) but also add them to
      // another array so we can log them.
      if (startDate && new Date(srcCommit.authorDate).getTime() < startDate.getTime()) {
        commitsBeforeStartDate.push(srcCommit);
        return false;
      }

      return true;
    });

  if (commitsBeforeStartDate.length !== 0) {
    logger.log(chalk.bold(chalk.red('Ignoring the following commits from before the start date:')));
    logger.log(
      commitsBeforeStartDate
        .map(
          (commit) =>
            ` ❌ ${chalk.red(commit.hash.slice(0, 10))} ${commit.authorDate} ${chalk.magenta(
              commit.authorName
            )} ${commit.title}`
        )
        .join('\n')
    );
    logger.log(''); // new line
  }

  if (candidateCommits.length === 0) {
    logger.success('There is nothing to cherry-pick.');
    return;
  }

  const { commitsToCherryPick } = await inquirer.prompt<{ commitsToCherryPick: string[] }>([
    {
      type: 'checkbox',
      name: 'commitsToCherryPick',
      message: `Choose which commits to cherry-pick from ${chalk.blue(source)} to ${chalk.blue(
        destination
      )}\n  ${chalk.green('●')} selected  ○ unselected\n`,
      choices: candidateCommits.map((commit) => ({
        value: commit.hash,
        short: commit.hash,
        name: `${chalk.yellow(commit.hash.slice(0, 10))} ${commit.authorDate} ${chalk.magenta(
          commit.authorName
        )} ${commit.title}`,
      })),
      default: candidateCommits.map((commit) => commit.hash),
      pageSize: Math.min(candidateCommits.length, (process.stdout.rows || 100) - 4),
    },
  ]);

  logger.info(''); // new line

  if (destination !== (await Git.getCurrentBranchNameAsync())) {
    if (options.dry) {
      logger.log(chalk.bold(chalk.yellow(`git checkout ${destination}`)));
    } else {
      logger.info(`Checking out ${chalk.bold(chalk.blue(destination))} branch...`);
      await Git.checkoutAsync({
        ref: destination,
      });
    }
  }

  // ensure we preserve the correct order of commits
  const commitsToCherryPickOrdered = candidateCommits.filter((commit) =>
    commitsToCherryPick.includes(commit.hash)
  );
  const commitHashes = commitsToCherryPickOrdered.map((commit) => commit.hash);
  if (options.dry) {
    logger.log(chalk.bold(chalk.yellow(`git cherry-pick ${commitHashes.join(' ')}`)));
  } else {
    logger.info(`Running ${chalk.yellow(`git cherry-pick ${commitHashes.join(' ')}`)}`);
    try {
      // pipe output to current process stdio to emulate user running this command directly
      await Git.cherryPickAsync(commitHashes, { inheritStdio: true });
    } catch {
      logger.error(
        `Expotools: could not complete cherry-pick. Resolve the conflicts and continue as instructed by git above.`
      );
    }
  }
}
