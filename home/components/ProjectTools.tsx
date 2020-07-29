import * as React from 'react';
import { Clipboard, InteractionManager, Linking, View } from 'react-native';

import FeatureFlags from '../FeatureFlags';
import * as UrlUtils from '../utils/UrlUtils';
import useAppState from '../utils/useAppState';
import ListItem from './ListItem';
import OpenFromClipboardButton from './OpenFromClipboardButton';
import QRCodeButton from './QRCodeButton';

const CLIPBOARD_POLL_INTERVAL = 2000;

type Props = {
  pollForUpdates: boolean;
};

type State = {
  clipboardContents: string;
  displayOpenClipboardButton: boolean;
};

const initialState: State = {
  clipboardContents: '',
  displayOpenClipboardButton: false,
};

export default function ProjectTools(props: Props) {
  if (FeatureFlags.ENABLE_PROJECT_TOOLS) {
    return <EnabledProjectTools {...props} />;
  }
  return <DisabledProjectTools />;
}

function DisabledProjectTools() {
  const onPress = React.useCallback(() => {
    Linking.openURL('https://docs.expo.io/get-started/installation/');
  }, []);

  return (
    <ListItem
      title="Get started with Expo"
      subtitle="Run projects from expo-cli or Snack."
      onPress={onPress}
      last
    />
  );
}

function EnabledProjectTools({ pollForUpdates }: Props) {
  const [state, setState] = React.useReducer(
    (props: State, state: Partial<State>): State => ({ ...props, ...state }),
    initialState
  );
  const clipboardUpdateInterval = React.useRef<null | number>(null);

  const appState = useAppState();

  React.useEffect(() => {
    if (pollForUpdates) {
      fetchClipboardContentsAsync();
    }
    return () => {
      stopPolling();
    };
  }, []);

  React.useEffect(() => {
    if (pollForUpdates && appState === 'active') {
      startPolling();
    } else {
      stopPolling();
    }
  }, [appState, pollForUpdates]);

  const startPolling = React.useCallback((): void => {
    if (clipboardUpdateInterval.current) return;

    clipboardUpdateInterval.current = setInterval(
      fetchClipboardContentsAsync,
      CLIPBOARD_POLL_INTERVAL
    );
  }, [clipboardUpdateInterval.current]);

  const stopPolling = React.useCallback((): void => {
    if (!clipboardUpdateInterval.current) return;

    clearInterval(clipboardUpdateInterval.current);
    clipboardUpdateInterval.current = null;
  }, [clipboardUpdateInterval.current]);

  const fetchClipboardContentsAsync = async (): Promise<void> => {
    let clipboardContents = await Clipboard.getString();

    if (typeof clipboardContents === 'string') {
      clipboardContents = clipboardContents.trim();
    }

    if (clipboardContents !== state.clipboardContents) {
      InteractionManager.runAfterInteractions(() => {
        setState({
          clipboardContents,
          displayOpenClipboardButton: UrlUtils.conformsToExpoProtocol(clipboardContents),
        });
      });
    }
  };

  const { clipboardContents, displayOpenClipboardButton } = state;

  return (
    <View>
      {FeatureFlags.ENABLE_QR_CODE_BUTTON && (
        <QRCodeButton last={!FeatureFlags.ENABLE_CLIPBOARD_BUTTON} />
      )}
      {FeatureFlags.ENABLE_CLIPBOARD_BUTTON && (
        <OpenFromClipboardButton
          clipboardContents={clipboardContents}
          isValid={displayOpenClipboardButton}
        />
      )}
    </View>
  );
}
