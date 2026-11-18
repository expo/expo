import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import {
  addActivationErrorListener,
  addInterruptionListener,
  addNowPlayingOwnerChangeListener,
  addRouteChangeListener,
  type AudioPolicy,
  getAudioPolicy,
  getNowPlayingOwnerId,
  holdSession,
  type InterruptionMode,
  type NowPlayingClaim,
  type NowPlayingInfo,
  type NowPlayingOwner,
  offerNowPlaying,
  releaseSession,
  type RemoteCommand,
  type RemoteCommandKind,
  setAudioPolicyAsync,
} from 'expo-media-session';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import TitledSwitch from '../components/TitledSwitch';

const interruptionModes: InterruptionMode[] = [
  'mixWithOthers',
  'duckOthers',
  'doNotMix',
  'doNotMixPersistent',
];

const commands: RemoteCommandKind[] = [
  'play',
  'pause',
  'togglePlayPause',
  'seek',
  'skipForward',
  'skipBackward',
  'nextTrack',
  'previousTrack',
];

const trackLength = 120;

async function silentToneUri(): Promise<string> {
  const sampleRate = 8000;
  const dataSize = sampleRate * 2;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) =>
    [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, dataSize, true);
  if (Platform.OS === 'web') {
    return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
  }
  const file = new File(Paths.cache, 'media-session-silence.wav');
  if (!file.exists) {
    file.create();
    await file.write(bytes);
  }
  return file.uri;
}

type DemoListener = { onChange: () => void; onLog: (line: string) => void };

class DemoOwner implements NowPlayingOwner {
  readonly mediaType = 'audio';
  claim: NowPlayingClaim | null = null;
  track = 0;
  private offset = 0;
  private startedAt: number | null = null;
  private playing = false;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    readonly nowPlayingId: string,
    private readonly player: AudioPlayer,
    private readonly listener: DemoListener
  ) {}

  private onChange() {
    this.listener.onChange();
  }

  private log(line: string) {
    this.listener.onLog(line);
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  get position(): number {
    const elapsed = this.startedAt === null ? 0 : (Date.now() - this.startedAt) / 1000;
    return Math.min(Math.floor(this.offset + elapsed), trackLength);
  }

  set position(seconds: number) {
    this.offset = Math.min(Math.max(seconds, 0), trackLength);
    this.startedAt = this.playing ? Date.now() : null;
  }

  get info(): NowPlayingInfo {
    return {
      title: `${this.nowPlayingId} track ${this.track + 1}`,
      artist: 'expo-media-session demo',
      duration: trackLength,
      elapsedTime: this.position,
      playbackRate: this.playing ? 1 : 0,
      queueIndex: this.track,
      queueCount: 3,
      skipForwardInterval: 15,
      skipBackwardInterval: 15,
    };
  }

  offer() {
    this.claim = offerNowPlaying(this, this.info, commands);
    this.onChange();
  }

  setPlaying(playing: boolean) {
    const position = this.position;
    this.playing = playing;
    this.position = position;
    if (playing) {
      this.player.play();
      this.timer ??= setInterval(() => this.onChange(), 1000);
    } else {
      this.player.pause();
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
    this.publish();
  }

  publish() {
    this.claim?.update(this.info);
    this.onChange();
  }

  withdraw(reason: 'ended' | 'released') {
    this.setPlaying(false);
    this.claim?.withdraw(reason);
    this.claim = null;
    this.onChange();
  }

  handle(command: RemoteCommand): boolean {
    this.log(
      `${this.nowPlayingId} handle ${command.kind}${command.value != null ? ` ${command.value}` : ''}`
    );
    switch (command.kind) {
      case 'play':
        this.setPlaying(true);
        return true;
      case 'pause':
        this.setPlaying(false);
        return true;
      case 'togglePlayPause':
        this.setPlaying(!this.playing);
        return true;
      case 'seek':
        this.position = command.value ?? this.position;
        break;
      case 'skipForward':
        this.position = Math.min(this.position + (command.value ?? 15), trackLength);
        break;
      case 'skipBackward':
        this.position = Math.max(this.position - (command.value ?? 15), 0);
        break;
      case 'nextTrack':
        this.track = (this.track + 1) % 3;
        this.position = 0;
        break;
      case 'previousTrack':
        this.track = (this.track + 2) % 3;
        this.position = 0;
        break;
      default:
        return false;
    }
    this.publish();
    return true;
  }

  dispose() {
    this.withdraw('released');
    this.player.remove();
  }

  pauseForTakeover() {
    this.log(`${this.nowPlayingId} paused for takeover`);
    this.setPlaying(false);
  }

  resumeAfterTakeover() {
    this.log(`${this.nowPlayingId} resumed after takeover`);
    this.setPlaying(true);
  }
}

function testPrefix(owner: DemoOwner): string {
  return `media-session-${owner.nowPlayingId.toLowerCase().replace(' ', '-')}`;
}

export default function MediaSessionScreen() {
  const [policy, setPolicy] = useState<AudioPolicy>(() => getAudioPolicy());
  const [held, setHeld] = useState(false);
  const heldRef = useRef(false);
  const [ownerId, setOwnerId] = useState<string | null>(() => getNowPlayingOwnerId());
  const [log, setLog] = useState<string[]>([]);
  const [owners, setOwners] = useState<DemoOwner[]>([]);
  const [, setRevision] = useState(0);

  const appendLog = useCallback((line: string) => {
    setLog((lines) => [`${new Date().toLocaleTimeString()} ${line}`, ...lines].slice(0, 50));
  }, []);

  useEffect(() => {
    const subscriptions = [
      addInterruptionListener((event) =>
        appendLog(
          event.type === 'began'
            ? `interruption began (${event.reason})`
            : `interruption ended, shouldResume ${event.shouldResume}`
        )
      ),
      addRouteChangeListener((event) => appendLog(`route change (${event.reason})`)),
      addActivationErrorListener((event) =>
        appendLog(`activation error from ${event.client}: ${event.message}`)
      ),
      addNowPlayingOwnerChangeListener((event) => {
        setOwnerId(event.id);
        appendLog(`Now Playing owner: ${event.id ?? 'none'}`);
      }),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, [appendLog]);

  useEffect(() => {
    let disposed = false;
    let changedAudioMode = false;
    let created: DemoOwner[] = [];
    const listener: DemoListener = {
      onChange: () => setRevision((revision) => revision + 1),
      onLog: appendLog,
    };
    const setUp = async () => {
      if (Platform.OS === 'android') {
        changedAudioMode = true;
        await setAudioModeAsync({ interruptionMode: 'mixWithOthers' });
      }
      const uri = await silentToneUri();
      if (disposed) {
        return;
      }
      created = ['Owner A', 'Owner B'].map((id) => {
        const player = createAudioPlayer({ uri }, { keepAudioSessionActive: true });
        player.loop = true;
        return new DemoOwner(id, player, listener);
      });
      setOwners(created);
    };
    setUp().catch((error) =>
      appendLog(`setup failed: ${error instanceof Error ? error.message : error}`)
    );
    return () => {
      disposed = true;
      created.forEach((owner) => owner.dispose());
      setOwners([]);
      if (heldRef.current) {
        releaseSession('demo');
        heldRef.current = false;
        setHeld(false);
      }
      if (changedAudioMode) {
        setAudioModeAsync({ interruptionMode: 'doNotMix' }).catch(() => {});
      }
    };
  }, [appendLog]);

  const updatePolicy = async (update: Partial<AudioPolicy>) => {
    try {
      await setAudioPolicyAsync(update);
      appendLog(`policy updated: ${JSON.stringify(update)}`);
    } catch (error) {
      appendLog(`policy rejected: ${error instanceof Error ? error.message : error}`);
    }
    setPolicy(getAudioPolicy());
  };

  const toggleHold = () => {
    if (held) {
      releaseSession('demo');
    } else {
      holdSession('demo');
    }
    appendLog(held ? 'released hold "demo"' : 'holding "demo"');
    heldRef.current = !held;
    setHeld(!held);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HeadingText>Audio policy</HeadingText>
      <Text testID="media-session-policy">{JSON.stringify(policy)}</Text>
      <View style={styles.row}>
        {interruptionModes.map((mode) => (
          <Button
            key={mode}
            testID={`media-session-mode-${mode}`}
            style={styles.button}
            title={mode}
            disabled={policy.interruptionMode === mode}
            onPress={() => updatePolicy({ interruptionMode: mode })}
          />
        ))}
      </View>
      <TitledSwitch
        testID="media-session-silent-mode"
        title="Plays in silent mode"
        value={policy.playsInSilentMode}
        setValue={(value) => updatePolicy({ playsInSilentMode: value })}
      />
      <TitledSwitch
        testID="media-session-background"
        title="Plays in background"
        value={policy.shouldPlayInBackground}
        setValue={(value) => updatePolicy({ shouldPlayInBackground: value })}
      />

      <HeadingText>Session</HeadingText>
      <Button
        testID="media-session-hold"
        style={styles.button}
        title={held ? 'Release session' : 'Hold session'}
        onPress={toggleHold}
      />

      <HeadingText>Now Playing</HeadingText>
      <Text testID="media-session-owner">Owner: {ownerId ?? 'none'}</Text>
      {owners.map((owner) => (
        <View key={owner.nowPlayingId} style={styles.owner}>
          <Text testID={`${testPrefix(owner)}-status`} style={styles.ownerTitle}>
            {owner.nowPlayingId}: {owner.claim ? 'offered' : 'not offered'},{' '}
            {owner.isPlaying ? 'playing' : 'paused'}, track {owner.track + 1}, {owner.position}s
          </Text>
          <View style={styles.row}>
            <Button
              testID={`${testPrefix(owner)}-offer`}
              style={styles.button}
              title="Offer"
              onPress={() => {
                owner.setPlaying(true);
                owner.offer();
              }}
            />
            <Button
              testID={`${testPrefix(owner)}-toggle`}
              style={styles.button}
              title={owner.isPlaying ? 'Pause' : 'Play'}
              disabled={!owner.claim}
              onPress={() => owner.setPlaying(!owner.isPlaying)}
            />
            <Button
              testID={`${testPrefix(owner)}-end`}
              style={styles.button}
              title="End"
              disabled={!owner.claim}
              onPress={() => owner.withdraw('ended')}
            />
            <Button
              testID={`${testPrefix(owner)}-release`}
              style={styles.button}
              title="Release"
              disabled={!owner.claim}
              onPress={() => owner.withdraw('released')}
            />
          </View>
        </View>
      ))}

      <HeadingText>Events</HeadingText>
      <Button
        testID="media-session-clear-log"
        style={styles.button}
        title="Clear"
        onPress={() => setLog([])}
      />
      <Text testID="media-session-log">{log.join('\n')}</Text>
    </ScrollView>
  );
}

MediaSessionScreen.navigationOptions = {
  title: 'MediaSession',
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    margin: 4,
  },
  owner: {
    marginVertical: 6,
  },
  ownerTitle: {
    fontWeight: '600',
  },
});
