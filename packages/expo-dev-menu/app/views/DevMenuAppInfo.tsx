import React from 'react';
import { Image, StyleSheet, View, PixelRatio } from 'react-native';

import { DevMenuAppInfoType } from '../DevMenuInternal';
import { StyledText } from '../components/Text';
import { StyledView } from '../components/Views';
import Colors from '../constants/Colors';

type Props = {
  appInfo: DevMenuAppInfoType;
};

class DevMenuAppInfo extends React.PureComponent<Props, any> {
  render() {
    const { appInfo } = this.props;

    if (!appInfo) {
      return null;
    }

    const { appName, appVersion, appIcon, hostUrl, expoSdkVersion } = appInfo;
    const jsRuntime = createJSRuntimeInfo();

    return (
      <StyledView
        style={styles.appInfoContainer}
        lightBackgroundColor={Colors.light.secondaryBackground}
        darkBackgroundColor={Colors.dark.secondaryBackground}>
        <View style={styles.appIconColumn}>
          {appIcon ? (
            <Image source={{ uri: appIcon }} style={styles.appIcon} />
          ) : (
            <AppIconPlaceholder />
          )}
        </View>
        <View style={styles.appInfoColumn}>
          <View style={styles.appInfoRow}>
            <StyledText style={styles.appName} numberOfLines={1}>
              {appName ?? 'Untitled project'}
            </StyledText>
          </View>
          <AppInfoRow name="Version" value={appVersion} />
          <AppInfoRow name="Host" value={hostUrl?.replace(/^\w+:\/\//, '').replace(/\/.*$/, '')} />
          <AppInfoRow name="SDK" value={expoSdkVersion} />
          <AppInfoRow name="JS Engine" value={jsRuntime} />
        </View>
      </StyledView>
    );
  }
}

function AppIconPlaceholder() {
  return (
    <StyledView
      style={[styles.appIcon, styles.appIconPlaceholder]}
      lightBackgroundColor={Colors.light.appIconPlaceholderBackground}
      darkBackgroundColor={Colors.dark.appIconPlaceholderBackground}
      lightBorderColor={Colors.light.appIconPlaceholderBorder}
      darkBorderColor={Colors.dark.appIconPlaceholderBorder}
    />
  );
}

function AppInfoStyledText(props) {
  return (
    <StyledText
      style={props.style}
      lightColor={Colors.light.secondaryText}
      darkColor={Colors.dark.secondaryText}>
      {props.children}
    </StyledText>
  );
}

function AppInfoRow({ name, value }: { name: string; value?: string }) {
  if (!value) {
    return null;
  }
  return (
    <View style={styles.appInfoRow}>
      <AppInfoStyledText style={styles.appInfoKey} numberOfLines={1}>
        {name}:
      </AppInfoStyledText>
      <AppInfoStyledText style={styles.appInfoValue} numberOfLines={1}>
        {value}
      </AppInfoStyledText>
    </View>
  );
}

function createJSRuntimeInfo(): string {
  if (global['HermesInternal']) {
    let result = 'Hermes';
    const bytecodeVersion = global['HermesInternal'].getRuntimeProperties()['Bytecode Version'];
    if (bytecodeVersion) {
      result += ` (bytecode v${bytecodeVersion})`;
    }
    return result;
  }
  return 'JavaScriptCore';
}

const styles = StyleSheet.create({
  appInfoContainer: {
    flexDirection: 'row',
    padding: 14,
    borderBottomWidth: 2 / PixelRatio.get(),
  },
  appIconColumn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfoColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  appInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
  },
  appInfoKey: {
    fontWeight: '700',
    fontSize: 10,
    marginRight: 5,
  },
  appInfoValue: {
    fontSize: 10,
  },
  appIcon: {
    width: 52,
    height: 52,
    alignSelf: 'center',
    borderRadius: 10,
  },
  appIconPlaceholder: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});

export default DevMenuAppInfo;
