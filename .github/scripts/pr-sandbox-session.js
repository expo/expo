#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const COMMENT_MARKER_PATTERN =
  /<!-- pr-sandbox-session (session|command|result|destroy) ([A-Za-z0-9_.:-]+)(?: ([A-Za-z0-9_.:-]+))? -->\s*```json\s*([\s\S]*?)\s*```/;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_.:-]{1,120}$/;
const DOCKER_IMAGE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:/@-]{0,255}$/;
const MAX_COMMAND_LENGTH = 8192;
const DEFAULT_COMMAND_TIMEOUT_MS = 300000;
const MAX_COMMAND_TIMEOUT_MS = 3600000;
const DEFAULT_IMAGE = 'node:22-bookworm';
const MAX_OUTPUT_CHARS = 12000;
const POLL_INTERVAL_MS = 5000;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}

function parsePositiveInteger(value, name) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return number;
}

function delayAsync(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateOutput(value) {
  if (value.length <= MAX_OUTPUT_CHARS) {
    return value;
  }
  const half = Math.floor(MAX_OUTPUT_CHARS / 2);
  return `${value.slice(0, half)}\n... output truncated ...\n${value.slice(-half)}`;
}

function buildComment(kind, sessionId, payload, commandId) {
  const marker = `<!-- pr-sandbox-session ${kind} ${sessionId}${
    commandId ? ` ${commandId}` : ''
  } -->`;
  return `${marker}\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
}

function parseComment(comment) {
  const match = comment.body?.match(COMMENT_MARKER_PATTERN);
  if (!match) {
    return null;
  }
  const [, kind, sessionId, commandId, rawPayload] = match;
  try {
    return {
      kind,
      sessionId,
      commandId,
      payload: JSON.parse(rawPayload),
      commentId: comment.id,
      createdAt: comment.created_at,
      authorLogin: comment.user?.login,
    };
  } catch {
    return null;
  }
}

function normalizeCwd(cwd, repoDir) {
  const value = cwd == null || cwd === '' ? '.' : String(cwd);
  const normalized = value
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/\/+$/, '');
  if (
    normalized.startsWith('/') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../') ||
    normalized.endsWith('/..')
  ) {
    throw new Error('cwd must be a relative path inside the checked-out repository.');
  }
  const relativeCwd = !normalized || normalized === '.' ? '.' : normalized;
  const resolved = path.resolve(repoDir, relativeCwd);
  if (resolved !== repoDir && !resolved.startsWith(`${repoDir}${path.sep}`)) {
    throw new Error('cwd must resolve inside the checked-out repository.');
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    throw new Error(`cwd does not exist: ${relativeCwd}`);
  }
  return {
    relativeCwd,
    containerCwd: relativeCwd === '.' ? '/workspace/repo' : `/workspace/repo/${relativeCwd}`,
  };
}

function normalizeNetwork(network) {
  if (network == null || network === '' || network === 'none') {
    return 'none';
  }
  if (network === 'bridge' || network === 'default') {
    return 'bridge';
  }
  throw new Error('network must be "none", "bridge", or "default".');
}

function normalizeImage(image) {
  if (image == null || image === '') {
    return DEFAULT_IMAGE;
  }
  if (!DOCKER_IMAGE_PATTERN.test(String(image))) {
    throw new Error('image must be a Docker image reference without whitespace.');
  }
  return String(image);
}

function normalizeTimeout(timeout) {
  const value = timeout == null || timeout === '' ? DEFAULT_COMMAND_TIMEOUT_MS : Number(timeout);
  if (!Number.isInteger(value) || value <= 0 || value > MAX_COMMAND_TIMEOUT_MS) {
    throw new Error(`timeout must be a positive integer up to ${MAX_COMMAND_TIMEOUT_MS}.`);
  }
  return value;
}

function normalizeCommandPayload(payload, repoDir) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('command payload must be an object.');
  }
  const command = String(payload.command ?? '').trim();
  if (!command || command.length > MAX_COMMAND_LENGTH || command.includes('\0')) {
    throw new Error(`command must be 1-${MAX_COMMAND_LENGTH} characters.`);
  }
  const cwd = normalizeCwd(payload.cwd, repoDir);
  return {
    command,
    cwd: cwd.relativeCwd,
    containerCwd: cwd.containerCwd,
    timeout: normalizeTimeout(payload.timeout),
    network: normalizeNetwork(payload.network),
    image: normalizeImage(payload.image),
  };
}

async function githubApiAsync(apiPath, options = {}) {
  const response = await fetch(`https://api.github.com${apiPath}`, {
    method: options.method ?? 'GET',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${requiredEnv('GITHUB_TOKEN')}`,
      'content-type': 'application/json',
      'user-agent': 'expo-pr-sandbox-session',
      'x-github-api-version': '2022-11-28',
    },
    body: options.body == null ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(
      `GitHub API request failed: ${response.status} ${response.statusText} ${JSON.stringify(data)}`
    );
  }
  return data;
}

async function listCommentsAsync(controlOwner, controlRepo, controlIssue) {
  const comments = [];
  for (let page = 1; ; page++) {
    const pageComments = await githubApiAsync(
      `/repos/${controlOwner}/${controlRepo}/issues/${controlIssue}/comments?per_page=100&page=${page}`
    );
    comments.push(...pageComments);
    if (pageComments.length < 100) {
      return comments;
    }
  }
}

async function postCommentAsync(controlOwner, controlRepo, controlIssue, body) {
  await githubApiAsync(`/repos/${controlOwner}/${controlRepo}/issues/${controlIssue}/comments`, {
    method: 'POST',
    body: { body },
  });
}

function listSessionEntries(comments, sessionId) {
  return comments
    .map((comment) => parseComment(comment))
    .filter((entry) => entry?.sessionId === sessionId)
    .sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return aTime - bTime || (a.commentId ?? 0) - (b.commentId ?? 0);
    });
}

async function runDockerCommandAsync(request, repoDir) {
  const startedAt = new Date().toISOString();
  let stdout = '';
  let stderr = '';
  let timedOut = false;

  const args = [
    'run',
    '--rm',
    '--network',
    request.network,
    '--cpus',
    '2',
    '--memory',
    '6g',
    '--pids-limit',
    '512',
    '--security-opt',
    'no-new-privileges',
    '--cap-drop',
    'ALL',
    '-e',
    'HOME=/tmp',
    '-v',
    `${repoDir}:/workspace/repo`,
    '-w',
    request.containerCwd,
    request.image,
    'bash',
    '-lc',
    request.command,
  ];

  return await new Promise((resolve) => {
    const child = spawn('docker', args, {
      cwd: repoDir,
      env: { PATH: process.env.PATH },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, request.timeout);

    child.stdout.on('data', (chunk) => {
      stdout = truncateOutput(stdout + chunk.toString());
    });
    child.stderr.on('data', (chunk) => {
      stderr = truncateOutput(stderr + chunk.toString());
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        success: false,
        error: error.message,
        stdout,
        stderr,
        startedAt,
        finishedAt: new Date().toISOString(),
      });
    });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        success: exitCode === 0 && !timedOut,
        exitCode: exitCode ?? undefined,
        error: timedOut
          ? `Command timed out after ${request.timeout}ms.`
          : signal
            ? `Command exited with signal ${signal}.`
            : undefined,
        stdout,
        stderr,
        startedAt,
        finishedAt: new Date().toISOString(),
      });
    });
  });
}

async function mainAsync() {
  const sessionId = requiredEnv('PR_SANDBOX_SESSION_ID');
  if (!SESSION_ID_PATTERN.test(sessionId)) {
    throw new Error('Invalid PR_SANDBOX_SESSION_ID.');
  }
  const [controlOwner, controlRepo] = requiredEnv('GITHUB_REPOSITORY').split('/');
  const controlIssue = parsePositiveInteger(
    requiredEnv('PR_SANDBOX_CONTROL_ISSUE'),
    'PR_SANDBOX_CONTROL_ISSUE'
  );
  const idleTimeoutMs =
    parsePositiveInteger(
      requiredEnv('PR_SANDBOX_IDLE_TIMEOUT_SECONDS'),
      'PR_SANDBOX_IDLE_TIMEOUT_SECONDS'
    ) * 1000;
  const controllerLogin = requiredEnv('PR_SANDBOX_CONTROLLER_LOGIN');
  const repoDir = path.resolve(requiredEnv('PR_SANDBOX_REPO_DIR'));

  let lastActivityAt = Date.now();
  const startedAt = new Date().toISOString();

  await postCommentAsync(
    controlOwner,
    controlRepo,
    controlIssue,
    buildComment('session', sessionId, {
      sessionId,
      status: 'ready',
      controllerLogin,
      repoDir: '/workspace/repo',
      startedAt,
    })
  );

  while (true) {
    const comments = await listCommentsAsync(controlOwner, controlRepo, controlIssue);
    const entries = listSessionEntries(comments, sessionId);
    const trustedDestroy = entries.find(
      (entry) => entry.kind === 'destroy' && entry.authorLogin === controllerLogin
    );
    if (trustedDestroy) {
      await postCommentAsync(
        controlOwner,
        controlRepo,
        controlIssue,
        buildComment('session', sessionId, {
          sessionId,
          status: 'destroyed',
          startedAt,
          finishedAt: new Date().toISOString(),
        })
      );
      return;
    }

    const resultIds = new Set(
      entries
        .filter((entry) => entry.kind === 'result' && entry.authorLogin === 'github-actions[bot]')
        .map((entry) => entry.commandId)
    );
    const nextCommand = entries.find(
      (entry) =>
        entry.kind === 'command' &&
        entry.commandId &&
        entry.authorLogin === controllerLogin &&
        !resultIds.has(entry.commandId)
    );

    if (nextCommand) {
      let result;
      try {
        const request = normalizeCommandPayload(nextCommand.payload, repoDir);
        const execution = await runDockerCommandAsync(request, repoDir);
        result = {
          sessionId,
          commandId: nextCommand.commandId,
          command: request.command,
          cwd: request.cwd,
          timeout: request.timeout,
          network: request.network,
          image: request.image,
          ...execution,
        };
      } catch (error) {
        result = {
          sessionId,
          commandId: nextCommand.commandId,
          command: nextCommand.payload?.command ?? '',
          cwd: nextCommand.payload?.cwd ?? '.',
          timeout: nextCommand.payload?.timeout ?? DEFAULT_COMMAND_TIMEOUT_MS,
          network: nextCommand.payload?.network ?? 'none',
          image: nextCommand.payload?.image ?? DEFAULT_IMAGE,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          finishedAt: new Date().toISOString(),
        };
      }

      await postCommentAsync(
        controlOwner,
        controlRepo,
        controlIssue,
        buildComment('result', sessionId, result, nextCommand.commandId)
      );
      lastActivityAt = Date.now();
      continue;
    }

    if (Date.now() - lastActivityAt > idleTimeoutMs) {
      await postCommentAsync(
        controlOwner,
        controlRepo,
        controlIssue,
        buildComment('session', sessionId, {
          sessionId,
          status: 'idle_timeout',
          startedAt,
          finishedAt: new Date().toISOString(),
        })
      );
      return;
    }

    await delayAsync(POLL_INTERVAL_MS);
  }
}

mainAsync().catch((error) => {
  console.error(error);
  process.exit(1);
});
