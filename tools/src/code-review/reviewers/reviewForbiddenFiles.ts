import minimatch from 'minimatch';
import path from 'path';
import prettyBytes from 'pretty-bytes';

import Git from '../../Git';
import logger from '../../Logger';
import { ReviewInput, ReviewOutput, ReviewStatus } from '../types';

const FILE_SIZE_LIMIT = 5 * 1000 * 1000; // 5MB
const PRETTY_FILE_SIZE_LIMIT = prettyBytes(FILE_SIZE_LIMIT);

const IGNORED_PATHS = ['android/versioned-abis/**/*.aar'];

export default async function ({ pullRequest, diff }: ReviewInput): Promise<ReviewOutput | null> {
  if (!pullRequest.head) {
    logger.warn('Detached PR, we cannot asses the state of files!', pullRequest);
    return null;
  }

  const listTree = await Git.listTreeAsync(
    pullRequest.head.sha,
    diff.filter((file) => !file.deleted).map((file) => file.path)
  );

  const fileReports = listTree
    .map((file) => {
      const logs: string[] = [];

      // We may ignore some paths where the files are allowed to be bigger (e.g. versioned .aar files).
      if (IGNORED_PATHS.some((pattern) => minimatch(file.path, pattern))) {
        return null;
      }

      const extname = path.extname(file.path).substr(1).toLowerCase();
      if (extname === 'gif') {
        logs.push(`**GIF** files are forbidden, please consider using **MP4** instead`);
      }

      if (file.size > FILE_SIZE_LIMIT) {
        const prettySize = prettyBytes(file.size);
        logs.push(`File size **${prettySize}** exceeds the limit of **${PRETTY_FILE_SIZE_LIMIT}**`);
      }

      if (logs.length === 0) {
        return null;
      }
      return `- ${linkToFile(pullRequest.head, file.path)}\n  - ${logs.join('\n  - ')}`;
    })
    .filter(Boolean);

  if (fileReports.length === 0) {
    return null;
  }

  return {
    status: ReviewStatus.ERROR,
    title: 'Forbidden file size or format',
    body: fileReports.join('\n'),
  };
}

function linkToFile(head: ReviewInput['pullRequest']['head'], path: string): string {
  return `[${path}](${head.repo?.html_url}/blob/${head.ref}/${encodeURIComponent(path)})`;
}
