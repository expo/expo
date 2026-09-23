import type { ExpoConfig } from '@expo/config';
import path from 'node:path';
import { z } from 'zod';

import { Log } from '../../../log';
import { isPathInside } from '../../../utils/dir';
import { parseErrorStack, symbolicate } from '../metro/log-box/LogBoxSymbolication';
import { ToolNameSchema, formatIssues } from './ModelContext.schema';

/**
 * Who registered a tool, taken from the stack the app sent.
 * A caller can forge that stack, so the allowlist only stops accidental package tools.
 */
export type ToolOwner =
  | { kind: 'project'; file?: string }
  | { kind: 'package'; name: string; file?: string }
  | { kind: 'unknown' };

/**
 * Policy read from `expo.extra.modelContext` in the app config.
 *
 * ```json
 * { "expo": { "extra": { "modelContext": { "allowedPackages": ["expo-sqlite"] } } } }
 * ```
 */
export interface ModelContextPolicy {
  /** Packages whose runtime tools are exposed to agents. Tools from other packages are blocked. */
  allowedPackages: string[];
  /** Tool names that are never exposed, whatever the owner. */
  deniedTools: string[];
  /** Accept tools from apps that are not on the dev server's machine, such as a phone on the LAN. */
  allowRemoteDevices: boolean;
}

const PolicyConfigSchema = z
  .object({
    allowedPackages: z.array(z.string().min(1).max(214)).optional(),
    deniedTools: z.array(ToolNameSchema).optional(),
    allowRemoteDevices: z.boolean().optional(),
  })
  .strict();

export const EMPTY_POLICY: ModelContextPolicy = {
  allowedPackages: [],
  deniedTools: [],
  allowRemoteDevices: false,
};

export function parseModelContextPolicy(
  exp: Pick<ExpoConfig, 'extra'> | undefined
): ModelContextPolicy {
  const raw = exp?.extra?.modelContext;
  if (raw == null) {
    return EMPTY_POLICY;
  }
  const parsed = PolicyConfigSchema.safeParse(raw);
  if (!parsed.success) {
    Log.warn(
      `Ignoring invalid "expo.extra.modelContext" config: ${formatIssues(parsed.error)}. ` +
        `Expected { allowedPackages?: string[], deniedTools?: string[], allowRemoteDevices?: boolean }.`
    );
    return EMPTY_POLICY;
  }
  return { ...EMPTY_POLICY, ...parsed.data };
}

export type BlockReason =
  | 'denied-tool'
  | 'package-not-allowed'
  | 'unknown-owner'
  | 'untrusted-connection';

export type PolicyDecision = { allowed: true } | { allowed: false; reason: BlockReason };

export function evaluatePolicy(
  owner: ToolOwner,
  toolName: string,
  policy: ModelContextPolicy,
  trustedConnection: boolean
): PolicyDecision {
  if (policy.deniedTools.includes(toolName)) {
    return { allowed: false, reason: 'denied-tool' };
  }
  if (!trustedConnection && !policy.allowRemoteDevices) {
    return { allowed: false, reason: 'untrusted-connection' };
  }
  switch (owner.kind) {
    case 'project':
      return { allowed: true };
    case 'package':
      return policy.allowedPackages.includes(owner.name)
        ? { allowed: true }
        : { allowed: false, reason: 'package-not-allowed' };
    default:
      return { allowed: false, reason: 'unknown-owner' };
  }
}

/** Frames from these paths belong to the registry itself or to React and are skipped. */
const SKIPPED_FRAME_PATTERNS = [
  /[\\/]@expo[\\/]devtools[\\/](src|build)[\\/]modelContext[\\/]/,
  /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
  /[\\/]node_modules[\\/]react-native[\\/]Libraries[\\/]Renderer[\\/]/,
];

const PACKAGE_FROM_PATH = /[\\/]node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/g;

/**
 * Picks the owner from symbolicated frame paths (closest call site first).
 * Paths may be absolute or relative to `projectRoot`.
 */
export function classifyOwner(
  files: (string | null | undefined)[],
  projectRoot: string
): ToolOwner {
  for (const rawFile of files) {
    if (!rawFile || rawFile.startsWith('<') || rawFile.startsWith('http')) {
      continue;
    }
    const file = path.resolve(projectRoot, rawFile);
    if (SKIPPED_FRAME_PATTERNS.some((pattern) => pattern.test(file))) {
      continue;
    }
    // The last `node_modules/<name>` segment names the package that owns the file.
    let packageName: string | null = null;
    for (const match of file.matchAll(PACKAGE_FROM_PATH)) {
      packageName = match[1] ?? null;
    }
    if (packageName) {
      return { kind: 'package', name: packageName.replace(/\\/g, '/'), file };
    }
    return isPathInside(file, projectRoot) ? { kind: 'project', file } : { kind: 'unknown' };
  }
  return { kind: 'unknown' };
}

/**
 * Attributes a registration to the app or to a package by symbolicating the stack the app sent
 * through Metro, reusing the LogBox symbolication helpers. Returns `unknown` on failure.
 */
export async function resolveToolOwnerAsync({
  stack,
  projectRoot,
  symbolicateStack = symbolicate,
}: {
  stack: string | undefined;
  projectRoot: string;
  /** Used for injection when testing. */
  symbolicateStack?: typeof symbolicate;
}): Promise<ToolOwner> {
  const frames = parseErrorStack(stack).filter((frame) => frame.file && frame.lineNumber != null);
  if (frames.length === 0) {
    return { kind: 'unknown' };
  }
  // Frames that already point at source files (web builds, monorepos) need no symbolication.
  if (frames.every((frame) => !/^https?:/.test(frame.file!))) {
    return classifyOwner(
      frames.map((frame) => frame.file),
      projectRoot
    );
  }
  try {
    const symbolicated = await symbolicateStack(frames);
    return classifyOwner(
      symbolicated.stack.map((frame) => frame.file),
      projectRoot
    );
  } catch {
    return { kind: 'unknown' };
  }
}

export function describeOwner(owner: ToolOwner): string {
  switch (owner.kind) {
    case 'project':
      return 'the app';
    case 'package':
      return `package "${owner.name}"`;
    default:
      return 'an unknown source';
  }
}

export function describeBlockReason(reason: BlockReason, owner: ToolOwner): string {
  switch (reason) {
    case 'denied-tool':
      return 'listed in "expo.extra.modelContext.deniedTools"';
    case 'package-not-allowed':
      return (
        `registered by ${describeOwner(owner)}, which is not in "expo.extra.modelContext.allowedPackages"` +
        (owner.kind === 'package' ? ` (add "${owner.name}" to allow it)` : '')
      );
    case 'unknown-owner':
      return 'registered from a source the dev server could not attribute';
    case 'untrusted-connection':
      return 'registered from a device that is not local to the dev server (set "expo.extra.modelContext.allowRemoteDevices" to allow it)';
  }
}
