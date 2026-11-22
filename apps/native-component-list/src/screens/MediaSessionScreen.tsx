import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import {
  addActivationErrorListener,
  addInterruptionListener,
  addNowPlayingOwnerChangeListener,
  addRouteChangeListener,
  type AudioPolicy,
  beginSessionUse,
  getAudioPolicy,
  getNowPlayingOwner,
  holdSession,
  type InterruptionMode,
  type NowPlayingClaim,
  type NowPlayingInfo,
  type NowPlayingOwner,
  offerNowPlaying,
  releaseSession,
  type RemoteCommand,
  type RemoteCommandKind,
  type SessionUse,
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
    readonly name: string,
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
      title: `${this.name} track ${this.track + 1}`,
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

  withdraw() {
    this.setPlaying(false);
    this.claim?.withdraw();
    this.claim = null;
    this.onChange();
  }

  handle(command: RemoteCommand) {
    this.log(
      `${this.name} handle ${command.kind}${command.value != null ? ` ${command.value}` : ''}`
    );
    switch (command.kind) {
      case 'play':
        this.setPlaying(true);
        return;
      case 'pause':
        this.setPlaying(false);
        return;
      case 'togglePlayPause':
        this.setPlaying(!this.playing);
        return;
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
        return;
    }
    this.publish();
  }

  dispose() {
    this.withdraw();
    this.player.remove();
  }

  pauseForTakeover() {
    this.log(`${this.name} paused for takeover`);
    this.setPlaying(false);
  }

  resumeAfterTakeover() {
    this.log(`${this.name} resumed after takeover`);
    this.setPlaying(true);
  }
}

function nameOf(owner: NowPlayingOwner | null): string | null {
  return owner instanceof DemoOwner ? owner.name : null;
}

function testPrefix(owner: DemoOwner): string {
  return `media-session-${owner.name.toLowerCase().replace(' ', '-')}`;
}

export default function MediaSessionScreen() {
  const [policy, setPolicy] = useState<AudioPolicy>(() => getAudioPolicy());
  const [held, setHeld] = useState(false);
  const heldRef = useRef(false);
  const [ownerName, setOwnerName] = useState<string | null>(() => nameOf(getNowPlayingOwner()));
  const [log, setLog] = useState<string[]>([]);
  const [owners, setOwners] = useState<DemoOwner[]>([]);
  const [, setRevision] = useState(0);
  const sessionUseRef = useRef<SessionUse | null>(null);
  const [useStatus, setUseStatus] = useState('none');
  const [continuesInBackground, setContinuesInBackground] = useState(false);

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
        setOwnerName(nameOf(event.owner));
        appendLog(`Now Playing owner: ${nameOf(event.owner) ?? 'none'}`);
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

  useEffect(() => () => sessionUseRef.current?.end(), []);

  const beginUse = () => {
    const previous = sessionUseRef.current;
    const use = beginSessionUse('demo-js-use', { mixing: 'doNotMix', continuesInBackground });
    previous?.end();
    sessionUseRef.current = use;
    const isCurrent = () => sessionUseRef.current === use;
    use.addListener('pause', ({ reason }) => {
      appendLog(`session use paused (${reason})`);
      if (isCurrent()) setUseStatus(`paused (${reason})`);
    });
    use.addListener('resume', () => {
      appendLog('session use resumed');
      if (isCurrent()) setUseStatus('live');
    });
    use.addListener('duck', ({ isDucked }) => appendLog(`session use duck ${isDucked}`));
    use.addListener('fail', ({ message }) => appendLog(`session use failed: ${message}`));
    use.addListener('ended', () => {
      appendLog('session use ended by the module');
      if (isCurrent()) {
        sessionUseRef.current = null;
        setUseStatus('ended by the module');
      }
    });
    setUseStatus('live');
    appendLog(`began session use, continuesInBackground ${continuesInBackground}`);
  };

  const endUse = () => {
    sessionUseRef.current?.end();
    sessionUseRef.current = null;
    setUseStatus('none');
    appendLog('ended session use');
  };

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

      <HeadingText>Session</HeadingText>
      <Button
        testID="media-session-hold"
        style={styles.button}
        title={held ? 'Release session' : 'Hold session'}
        onPress={toggleHold}
      />

      <HeadingText>Session use</HeadingText>
      <Text testID="media-session-use-status">Use: {useStatus}</Text>
      <TitledSwitch
        testID="media-session-use-background"
        title="Continues in background"
        value={continuesInBackground}
        setValue={setContinuesInBackground}
      />
      <View style={styles.row}>
        <Button
          testID="media-session-use-begin"
          style={styles.button}
          title="Begin use"
          onPress={beginUse}
        />
        <Button
          testID="media-session-use-end"
          style={styles.button}
          title="End use"
          disabled={!sessionUseRef.current}
          onPress={endUse}
        />
      </View>

      <HeadingText>Now Playing</HeadingText>
      <Text testID="media-session-owner">Owner: {ownerName ?? 'none'}</Text>
      {owners.map((owner) => (
        <View key={owner.name} style={styles.owner}>
          <Text testID={`${testPrefix(owner)}-status`} style={styles.ownerTitle}>
            {owner.name}: {owner.claim ? 'offered' : 'not offered'},{' '}
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
              onPress={() => owner.withdraw()}
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
