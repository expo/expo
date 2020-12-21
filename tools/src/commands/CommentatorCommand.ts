import { Command } from '@expo/commander';
import chalk from 'chalk';
import { link } from '../Formatter';

import { commentOnIssueAsync } from '../GitHubActions';
import logger from '../Logger';

type ActionOptions = {
  payload: string;
};

export type CommentatorComment = {
  issue: number;
  body: string;
};

export type CommentatorPayload = CommentatorComment[];

export default (program: Command) => {
  program
    .command('commentator')
    .alias('comment')
    .option(
      '-p, --payload <payload>',
      'Serialized and escaped JSON describing what and where to comment.'
    )
    .asyncAction(main);
};

async function main(options: ActionOptions) {
  const payload = parsePayload(options.payload);
  const commentedIssues: number[] = [];

  if (!Array.isArray(payload)) {
    throw new Error(`Payload must be an array.`);
  }
  for (const comment of payload) {
    if (!comment.issue || !comment.body) {
      logger.error('Comment payload is incomplete:', comment);
      continue;
    }
    await commentOnIssueAsync(comment.issue, comment.body);
    commentedIssues.push(comment.issue);
  }
  if (commentedIssues.length > 0) {
    logger.log(
      '✍️  Commented on the following issues: %s',
      commentedIssues
        .map((issue) =>
          link(chalk.blue('#' + issue), `https://github.com/expo/expo/issues/${issue}`)
        )
        .join(', ')
    );
  } else {
    logger.log('✍️  Nothing to comment.');
  }
}

function parsePayload(payloadString: string): CommentatorPayload {
  const payload = JSON.parse(payloadString);
  return payload;
}
