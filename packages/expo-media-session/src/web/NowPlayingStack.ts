import type {
  InterruptionMode,
  NowPlayingClaim,
  NowPlayingInfo,
  NowPlayingOwner,
  RemoteCommand,
  RemoteCommandKind,
} from '../MediaSession.types';

export type NowPlayingCenterState = {
  info: NowPlayingInfo;
  mediaType: NowPlayingOwner['mediaType'];
  isPlaying: boolean;
  commands: Set<RemoteCommandKind>;
};

export interface NowPlayingCenter {
  setCommandHandler(handler: (command: RemoteCommand) => void): void;
  apply(state: NowPlayingCenterState | null): void;
}

type Entry = {
  claimId: number;
  owner: NowPlayingOwner;
  info: NowPlayingInfo;
  commands: Set<RemoteCommandKind>;
  pausedByTakeover: boolean;
  wasPlaying: boolean;
};

export class NowPlayingStack {
  private entries: Entry[] = [];
  private nextClaimId = 0;
  private applied: NowPlayingCenterState | null = null;
  private published: NowPlayingOwner | null = null;
  private callbacks: (() => void)[] = [];
  private depth = 0;

  constructor(
    private readonly center: NowPlayingCenter,
    private readonly mixingMode: () => InterruptionMode,
    private readonly onOwnerChange: (owner: NowPlayingOwner | null) => void = () => {}
  ) {
    center.setCommandHandler((command) => this.handle(command));
  }

  private top(): Entry | undefined {
    return this.entries[this.entries.length - 1];
  }

  get owner(): NowPlayingOwner | null {
    return this.published;
  }

  offer(
    owner: NowPlayingOwner,
    info: NowPlayingInfo,
    commands: RemoteCommandKind[]
  ): NowPlayingClaim {
    const claimId = ++this.nextClaimId;
    this.batch(() => this.push(owner, claimId, info, new Set(commands)));
    let withdrawn = false;
    return {
      update: (nextInfo, nextCommands) => {
        if (!withdrawn) {
          this.batch(() => this.update(claimId, nextInfo, nextCommands && new Set(nextCommands)));
        }
      },
      withdraw: () => {
        if (!withdrawn) {
          withdrawn = true;
          this.batch(() => this.withdraw(claimId));
        }
      },
    };
  }

  handle(command: RemoteCommand): void {
    this.batch(() => {
      this.settleTop();
      this.publish();
      const top = this.top();
      if (top && commandsOf(top).has(command.kind)) {
        this.callbacks.push(() => top.owner.handle(command));
      }
    });
  }

  // Owner callbacks may change claims, so they run after the stack reaches its final order.
  private batch(body: () => void): void {
    this.depth += 1;
    try {
      body();
    } finally {
      this.depth -= 1;
    }
    if (this.depth > 0) {
      return;
    }
    let callback: (() => void) | undefined;
    while ((callback = this.callbacks.shift())) {
      const run = callback;
      guarded(undefined, run);
    }
  }

  private push(
    owner: NowPlayingOwner,
    claimId: number,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind>
  ): void {
    this.settleTop();
    const top = this.top();
    const isPlaying = guarded(false, () => owner.isPlaying);
    const topPlays = !!top && top.owner !== owner && guarded(false, () => top.owner.isPlaying);
    if (isPlaying && topPlays) {
      this.pauseTopForTakeover();
    }
    this.entries = this.entries.filter((entry) => entry.owner !== owner);
    const entry: Entry = {
      claimId,
      owner,
      info,
      commands,
      pausedByTakeover: false,
      wasPlaying: isPlaying,
    };
    if (!isPlaying && topPlays) {
      let position = this.entries.length - 1;
      while (position > 0 && this.entries[position - 1]?.pausedByTakeover) {
        position -= 1;
      }
      this.entries.splice(position, 0, entry);
    } else {
      this.entries.push(entry);
    }
    this.publish();
  }

  private update(
    claimId: number,
    info: NowPlayingInfo,
    commands: Set<RemoteCommandKind> | undefined
  ): void {
    this.settleTop();
    const entry = this.entries.find((candidate) => candidate.claimId === claimId);
    if (!entry) {
      return;
    }
    entry.info = info;
    if (commands) {
      entry.commands = commands;
    }
    const isPlaying = guarded(false, () => entry.owner.isPlaying);
    const startedPlaying = isPlaying && !entry.wasPlaying;
    if (startedPlaying) {
      entry.pausedByTakeover = false;
    }
    entry.wasPlaying = isPlaying;
    if (startedPlaying && entry !== this.top()) {
      this.entries = this.entries.filter((candidate) => candidate !== entry);
      this.pauseTopForTakeover();
      this.entries.push(entry);
      this.publish(true);
    } else if (entry === this.top()) {
      this.publish(true);
    }
  }

  private pauseTopForTakeover(): void {
    const top = this.top();
    if (top && guarded(false, () => top.owner.isPlaying) && this.mixingMode() !== 'mixWithOthers') {
      top.pausedByTakeover = true;
      top.wasPlaying = true;
      this.callbacks.push(() => pauseForTakeover(top.owner));
    }
  }

  private withdraw(claimId: number): void {
    this.entries = this.entries.filter((entry) => entry.claimId !== claimId);
    this.settleTop();
    this.publish();
  }

  private settleTop(): void {
    const top = this.top();
    if (!top?.pausedByTakeover) {
      return;
    }
    top.pausedByTakeover = false;
    this.callbacks.push(() => resumeAfterTakeover(top.owner));
  }

  private publish(force = false): void {
    const top = this.top();
    const owner = top?.owner ?? null;
    if (owner !== this.published) {
      this.published = owner;
      this.onOwnerChange(owner);
    }
    const state: NowPlayingCenterState | null = top
      ? {
          info: top.info,
          mediaType: guarded('audio', () => top.owner.mediaType),
          isPlaying: guarded(false, () => top.owner.isPlaying),
          commands: commandsOf(top),
        }
      : null;
    if (force || !statesEqual(state, this.applied)) {
      this.applied = state;
      this.center.apply(state);
    }
  }
}

function pauseForTakeover(owner: NowPlayingOwner): void {
  if (owner.pauseForTakeover) {
    owner.pauseForTakeover();
  } else {
    owner.handle({ kind: 'pause' });
  }
}

function resumeAfterTakeover(owner: NowPlayingOwner): void {
  if (owner.resumeAfterTakeover) {
    owner.resumeAfterTakeover();
  } else {
    owner.handle({ kind: 'play' });
  }
}

function commandsOf(entry: Entry): Set<RemoteCommandKind> {
  if (!entry.info.isLiveStream) {
    return entry.commands;
  }
  const commands = new Set(entry.commands);
  commands.delete('seek');
  return commands;
}

function guarded<T>(fallback: T, body: () => T): T {
  try {
    return body();
  } catch (error) {
    console.warn(`A Now Playing owner threw: ${error}`);
    return fallback;
  }
}

function statesEqual(a: NowPlayingCenterState | null, b: NowPlayingCenterState | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return (
    infoEqual(a.info, b.info) &&
    a.mediaType === b.mediaType &&
    a.isPlaying === b.isPlaying &&
    a.commands.size === b.commands.size &&
    [...a.commands].every((kind) => b.commands.has(kind))
  );
}

function infoEqual(a: NowPlayingInfo, b: NowPlayingInfo): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof NowPlayingInfo>;
  return [...keys].every((key) => a[key] === b[key]);
}
