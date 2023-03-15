#!/usr/bin/env node
import { Command } from '../../bin/cli';
import { createRequestHandler } from '../export/server';
import { assertArgs, printHelp } from '../utils/args';
import { logCmdError } from '../utils/errors';
import http from 'http';

export const expoLogin: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--username': String,
      '--password': String,
      '--otp': String,
      // Aliases
      '-h': '--help',
      '-u': '--username',
      '-p': '--password',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Log in to an Expo account`,
      `npx expo login`,
      [
        `-u, --username <string>  Username`,
        `-p, --password <string>  Password`,
        `--otp <string>           One-time password from your 2FA device`,
        `-h, --help               Usage info`,
      ].join('\n')
    );
  }

  const handler = createRequestHandler(path.join(process.cwd(), 'dist'));

  // Start a basic server on port 3000
  const server = http.createServer();
  server.listen(3000, () => {
    console.log('Server listening on port 3000');
  });

  // add handler middleware

  server.on('request', handler);

  // const { showLoginPromptAsync } = await import('../api/user/actions');
  // return showLoginPromptAsync({
  //   // Parsed options
  //   username: args['--username'],
  //   password: args['--password'],
  //   otp: args['--otp'],
  // }).catch(logCmdError);
};

import path from 'path';
