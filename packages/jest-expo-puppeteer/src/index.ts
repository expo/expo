import { readConfigJson } from '@expo/config';
import fs from 'fs';
import { boolish } from 'getenv';
import path from 'path';

function getPuppeteerOptions() {
  if (boolish('CI', false)) {
    return {
      args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox'],
      ignoreHTTPSErrors: true,
      headless: true,
    };
  }
  return {
    args: ['--ignore-certificate-errors'],
    ignoreHTTPSErrors: true,
    headless: true,
  };
}

function isUndefined(value: any): boolean {
  return typeof value === 'undefined';
}

function ofCommands(commands: string[]): string {
  return commands.filter(Boolean).join(' && ');
}

export function withExpoPuppeteer(config: any = {}): { [key: string]: any } {
  const {
    mode = process.env.EXPO_WEB_E2E_ENV,
    preventRebuild,
    server = {},
    launch = {},
    projectRoot,
    ...partConfig
  } = config;
  const projectPath = path.resolve(projectRoot || process.cwd());

  // @ts-ignore: ProjectConfig doesn't declare "web" -- either fix this or the declaration
  const { web = {} } = readConfigJson(projectPath);

  const hasServerSideRendering = web.use === 'nextjs';
  const defaultPort = hasServerSideRendering ? 8000 : 5000;
  const { port: serverPort = defaultPort } = server;
  let defaultURL;
  let command;

  // Tell Expo CLI to use the same port on which the test runner expects there to be a server
  process.env.WEB_PORT = serverPort;

  if (mode === 'production') {
    defaultURL = `http://localhost:${serverPort}`;

    const outputBuildPath = (web.build || {}).output || 'web-build';

    const buildFolder = path.resolve(projectPath, outputBuildPath);
    const serveCommand = `serve ${buildFolder}`;
    const commands = [serveCommand];
    const hasBuild = fs.existsSync(buildFolder);

    if (!preventRebuild || !hasBuild) {
      const buildCommand = `node ${require.resolve('./build-expo.js')} ${projectPath}`;
      commands.unshift(buildCommand);
    }
    command = ofCommands(commands);
  } else {
    command = `expo start ${projectPath} --web-only --non-interactive --https`;
    defaultURL = `https://localhost:${serverPort}`;
  }

  const hasModules = fs.existsSync(path.resolve(projectPath, 'node_modules'));
  let launchTimeout = isNaN(server.launchTimeout) ? 30000 : server.launchTimeout;
  if (!hasModules) {
    launchTimeout += 30000;
    command = ofCommands([`cd ${projectPath} && yarn && cd ${process.cwd()}`, command]);
  }

  const url = isUndefined(config.url) ? defaultURL : config.url;

  return {
    hasServerSideRendering,
    ...partConfig,
    url,
    launch: {
      ...getPuppeteerOptions(),
      ...launch,
    },
    server: {
      launchTimeout,
      debug: true,
      ...server,
      command,
      port: serverPort,
    },
  };
}
