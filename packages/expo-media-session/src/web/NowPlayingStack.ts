import type {
  InterruptionMode,
  NowPlayingClaim,
  NowPlayingInfo,
  NowPlayingOwner,
  RemoteCommand,
  RemoteCommandKind,
  WithdrawReason,
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
};

export class NowPlayingStack {
  private entries: Entry[] = [];
  private nextClaimId = 0;
  private applied: NowPlayingCenterState | null = null;
  private topId: string | null = null;

  constructor(
    private readonly center: NowPlayingCenter,
    private readonly mixingMode: () => InterruptionMode,
    private readonly onOwnerChange: (id: string | null) => void = () => {}
  ) {
    center.setCommandHandler((command) => this.handle(command));
  }

  private top(): Entry | undefined {
    return this.entries[this.entries.length - 1];
  }

  get ownerId(): string | null {
    return this.topId;
  }

  offer(
    owner: NowPlayingOwner,
    info: NowPlayingInfo,
    commands: RemoteCommandKind[]
  ): NowPlayingClaim {
    const claimId = ++this.nextClaimId;
    this.push(owner, claimId, info, new Set(commands));
    let withdrawn = false;
    return {
      update: (nextInfo, nextCommands) => {
        if (!withdrawn) {
          this.update(claimId, nextInfo, nextCommands && new Set(nextCommands));
        }
      },
      withdraw: (reason) => {
        if (!withdrawn) {
          withdrawn = true;
          this.withdraw(claimId, reason);
        }
      },
    };
  }

  handle(command: RemoteCommand): void {
    this.settleTop();
    this.publish();
    const top = this.top();
    if (top && commandsOf(top).has(command.kind)) {
      guarded(false, () => top.owner.handle(command));
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
    if (
      top &&
      top.owner !== owner &&
      guarded(false, () => top.owner.isPlaying) &&
      this.mixingMode() !== 'mixWithOthers'
    ) {
      top.pausedByTakeover = true;
      guarded(undefined, () => pauseForTakeover(top.owner));
    }
    this.entries = this.entries.filter((entry) => entry.owner !== owner);
    this.entries.push({
      claimId,
      owner,
      info,
      commands,
      pausedByTakeover: false,
    });
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
    if (entry === this.top()) {
      this.publish(true);
    }
  }

  private withdraw(claimId: number, _reason: WithdrawReason): void {
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
    if (!guarded(true, () => top.owner.isPlaying)) {
      guarded(undefined, () => resumeAfterTakeover(top.owner));
    }
  }

  private publish(force = false): void {
    const top = this.top();
    const id = top ? guarded(null, () => top.owner.nowPlayingId) : null;
    if (id !== this.topId) {
      this.topId = id;
      this.onOwnerChange(id);
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
