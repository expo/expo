import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Clipboard, PixelRatio, StyleSheet } from 'react-native';

import { StyledView } from '../components/Views';
import DevMenuBottomSheetContext, { Context } from './DevMenuBottomSheetContext';
import DevMenuButton from './DevMenuButton';
import DevMenuCloseButton from './DevMenuCloseButton';
import * as DevMenu from './DevMenuModule';
import DevMenuOnboarding from './DevMenuOnboarding';
import DevMenuTaskInfo from './DevMenuTaskInfo';

type Props = {
  task: { [key: string]: any };
  uuid: string;
};

type State = {
  enableDevMenuTools: boolean;
  devMenuItems: { [key: string]: any };
  isOnboardingFinished: boolean;
  isLoaded: boolean;
};

// These are defined in EXVersionManager.m in a dictionary, ordering needs to be
// done here.
const DEV_MENU_ORDER = [
  'dev-live-reload',
  'dev-hmr',
  'dev-remote-debug',
  'dev-reload',
  'dev-perf-monitor',
  'dev-inspector',
];

const MENU_ITEMS_ICON_MAPPINGS: {
  [key: string]: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
} = {
  'dev-hmr': 'run-fast',
  'dev-remote-debug': 'remote-desktop',
  'dev-perf-monitor': 'speedometer',
  'dev-inspector': 'border-style',
};

class DevMenuView extends React.PureComponent<Props, State> {
  static contextType = DevMenuBottomSheetContext;

  // @ts-expect-error - the provided solution (declare operator) conflicts with @babel/plugin-transform-flow-strip-types
  context!: Context;

  constructor(props: Props, context?: unknown) {
    super(props, context);

    this.state = {
      enableDevMenuTools: false,
      devMenuItems: {},
      isOnboardingFinished: false,
      isLoaded: false,
    };
  }

  componentDidMount() {
    this.loadStateAsync();
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.uuid !== prevProps.uuid) {
      this.loadStateAsync();
    }
  }

  collapse = async () => {
    if (this.context) {
      await this.context.collapse();
    }
  };

  collapseAndCloseDevMenuAsync = async () => {
    await this.collapse();
    await DevMenu.closeAsync();
  };

  loadStateAsync = async () => {
    this.setState({ isLoaded: false });

    const [enableDevMenuTools, devMenuItems, isOnboardingFinished] = await Promise.all([
      DevMenu.doesCurrentTaskEnableDevtoolsAsync(),
      DevMenu.getItemsToShowAsync(),
      DevMenu.isOnboardingFinishedAsync(),
    ]);

    this.setState({
      enableDevMenuTools,
      devMenuItems,
      isOnboardingFinished,
      isLoaded: true,
    });
  };

  onAppReload = () => {
    this.collapse();
    DevMenu.reloadAppAsync();
  };

  onCopyTaskUrl = async () => {
    const { manifestUrl } = this.props.task;

    await this.collapseAndCloseDevMenuAsync();
    Clipboard.setString(manifestUrl);
    alert(`Copied "${manifestUrl}" to the clipboard!`);
  };

  onGoToHome = () => {
    this.collapse();
    DevMenu.goToHomeAsync();
  };

  onPressDevMenuButton = (key: string) => {
    DevMenu.selectItemWithKeyAsync(key);
  };

  onOnboardingFinished = () => {
    DevMenu.setOnboardingFinishedAsync(true);
    this.setState({ isOnboardingFinished: true });
  };

  maybeRenderDevMenuTools() {
    const devMenuItems = Object.keys(this.state.devMenuItems).sort(
      (a, b) => DEV_MENU_ORDER.indexOf(a) - DEV_MENU_ORDER.indexOf(b)
    );

    if (this.state.enableDevMenuTools && this.state.devMenuItems) {
      return (
        <>
          <StyledView style={styles.separator} />
          {devMenuItems.map((key) => {
            return this.renderDevMenuItem(key, this.state.devMenuItems[key]);
          })}
        </>
      );
    }
    return null;
  }

  renderDevMenuItem(key: string, item: any) {
    const { label, isEnabled, detail } = item;

    return (
      <DevMenuButton
        key={key}
        buttonKey={key}
        label={label}
        onPress={this.onPressDevMenuButton}
        icon={MENU_ITEMS_ICON_MAPPINGS[key]}
        isEnabled={isEnabled}
        detail={detail}
      />
    );
  }

  renderContent() {
    const { task } = this.props;
    const { isLoaded, isOnboardingFinished } = this.state;

    if (!isLoaded) {
      return null;
    }

    return (
      <>
        {!isOnboardingFinished && <DevMenuOnboarding onClose={this.onOnboardingFinished} />}

        <DevMenuTaskInfo task={task} />

        <StyledView style={styles.separator} />

        <DevMenuButton buttonKey="reload" label="Reload" onPress={this.onAppReload} icon="reload" />
        {task && task.manifestUrl && (
          <DevMenuButton
            buttonKey="copy"
            label="Copy link to clipboard"
            onPress={this.onCopyTaskUrl}
            icon="clipboard-text"
          />
        )}
        <DevMenuButton buttonKey="home" label="Go to Home" onPress={this.onGoToHome} icon="home" />

        {this.maybeRenderDevMenuTools()}
        <DevMenuCloseButton
          style={styles.closeButton}
          onPress={this.collapseAndCloseDevMenuAsync}
        />
      </>
    );
  }

  render() {
    return (
      <StyledView style={styles.container} darkBackgroundColor="#000">
        {this.renderContent()}
      </StyledView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  buttonContainer: {
    backgroundColor: 'transparent',
  },
  separator: {
    borderTopWidth: 1 / PixelRatio.get(),
    height: 12,
    marginVertical: 4,
    marginHorizontal: -1,
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 3, // should be higher than zIndex of onboarding container
  },
});

export default DevMenuView;
