import { HomeFilledIcon, iconSize, RefreshIcon } from '@expo/styleguide-native';
import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import { Divider, useExpoTheme, View } from 'expo-dev-client-components';
import * as Font from 'expo-font';
import React, { Fragment, useContext, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DevMenuBottomSheetContext from './DevMenuBottomSheetContext';
import { DevMenuCloseButton } from './DevMenuCloseButton';
import { DevMenuItem } from './DevMenuItem';
import * as DevMenu from './DevMenuModule';
import { DevMenuOnboarding } from './DevMenuOnboarding';
import { DevMenuServerInfo } from './DevMenuServerInfo';
import { DevMenuTaskInfo } from './DevMenuTaskInfo';

type Props = {
  task: { manifestUrl: string; manifestString: string };
  uuid: string;
};

// These are defined in EXVersionManager.m in a dictionary, ordering needs to be
// done here.
const DEV_MENU_ORDER = [
  'dev-perf-monitor',
  'dev-inspector',
  'dev-remote-debug',
  'dev-live-reload',
  'dev-hmr',
  'dev-reload',
];

function ThemedMaterialIcon({
  name,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}) {
  const theme = useExpoTheme();
  return <MaterialCommunityIcons name={name} size={iconSize.regular} color={theme.icon.default} />;
}

const MENU_ITEMS_ICON_MAPPINGS: {
  [key: string]: React.ReactNode;
} = {
  'dev-hmr': <ThemedMaterialIcon name="run-fast" />,
  'dev-remote-debug': <ThemedMaterialIcon name="remote-desktop" />,
  'dev-perf-monitor': <ThemedMaterialIcon name="speedometer" />,
  'dev-inspector': <ThemedMaterialIcon name="border-style" />,
};

export function DevMenuView({ uuid, task }: Props) {
  const context = useContext(DevMenuBottomSheetContext);

  const [enableDevMenuTools, setEnableDevMenuTools] = React.useState(false);
  const [devMenuItems, setDevMenuItems] = React.useState<{ [key: string]: any }>({});
  const [isOnboardingFinished, setIsOnboardingFinished] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const theme = useExpoTheme();
  const insets = useSafeAreaInsets();

  const prevUUIDRef = useRef(uuid);

  useEffect(function didMount() {
    loadStateAsync();
  }, []);

  useEffect(
    function loadStateWhenUUIDChanges() {
      if (prevUUIDRef.current !== uuid) {
        loadStateAsync();
      }

      prevUUIDRef.current = uuid;
    },
    [uuid]
  );

  async function collapse() {
    if (context) {
      await context.collapse();
    }
  }

  async function collapseAndCloseDevMenuAsync() {
    await collapse();
    await DevMenu.closeAsync();
  }

  async function loadStateAsync() {
    setIsLoaded(false);

    const [enableDevMenuTools, devMenuItems, isOnboardingFinished] = await Promise.all([
      DevMenu.doesCurrentTaskEnableDevtoolsAsync(),
      DevMenu.getItemsToShowAsync(),
      DevMenu.isOnboardingFinishedAsync(),
      Font.loadAsync({
        'Inter-Black': require('../assets/Inter/Inter-Black.otf'),
        'Inter-BlackItalic': require('../assets/Inter/Inter-BlackItalic.otf'),
        'Inter-Bold': require('../assets/Inter/Inter-Bold.otf'),
        'Inter-BoldItalic': require('../assets/Inter/Inter-BoldItalic.otf'),
        'Inter-ExtraBold': require('../assets/Inter/Inter-ExtraBold.otf'),
        'Inter-ExtraBoldItalic': require('../assets/Inter/Inter-ExtraBoldItalic.otf'),
        'Inter-ExtraLight': require('../assets/Inter/Inter-ExtraLight.otf'),
        'Inter-ExtraLightItalic': require('../assets/Inter/Inter-ExtraLightItalic.otf'),
        'Inter-Regular': require('../assets/Inter/Inter-Regular.otf'),
        'Inter-Italic': require('../assets/Inter/Inter-Italic.otf'),
        'Inter-Light': require('../assets/Inter/Inter-Light.otf'),
        'Inter-LightItalic': require('../assets/Inter/Inter-LightItalic.otf'),
        'Inter-Medium': require('../assets/Inter/Inter-Medium.otf'),
        'Inter-MediumItalic': require('../assets/Inter/Inter-MediumItalic.otf'),
        'Inter-SemiBold': require('../assets/Inter/Inter-SemiBold.otf'),
        'Inter-SemiBoldItalic': require('../assets/Inter/Inter-SemiBoldItalic.otf'),
        'Inter-Thin': require('../assets/Inter/Inter-Thin.otf'),
        'Inter-ThinItalic': require('../assets/Inter/Inter-ThinItalic.otf'),
      }),
    ]);

    setEnableDevMenuTools(enableDevMenuTools);
    setDevMenuItems(devMenuItems);
    setIsOnboardingFinished(isOnboardingFinished);
    setIsLoaded(true);
  }

  function onAppReload() {
    collapse();
    DevMenu.reloadAppAsync();
  }

  function onGoToHome() {
    collapse();
    DevMenu.goToHomeAsync();
  }

  function onPressDevMenuButton(key: string) {
    DevMenu.selectItemWithKeyAsync(key);
  }

  function onOnboardingFinished() {
    DevMenu.setOnboardingFinishedAsync(true);
    setIsOnboardingFinished(true);
  }

  const sortedDevMenuItems = Object.keys(devMenuItems).sort(
    (a, b) => DEV_MENU_ORDER.indexOf(a) - DEV_MENU_ORDER.indexOf(b)
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <View bg="secondary" flex="1" roundedTop="large" overflow="hidden" style={{ direction: 'ltr' }}>
      <DevMenuTaskInfo task={task} />
      <Divider />
      <View>
        {!isOnboardingFinished ? (
          <DevMenuOnboarding onClose={onOnboardingFinished} />
        ) : (
          <View style={{ paddingBottom: insets.bottom }}>
            <DevMenuServerInfo task={task} />
            <Divider />
            <View padding="medium">
              <View bg="default" rounded="large">
                <DevMenuItem
                  buttonKey="reload"
                  label="Reload"
                  onPress={onAppReload}
                  icon={<RefreshIcon size={iconSize.small} color={theme.icon.default} />}
                />
                <Divider />
                <DevMenuItem
                  buttonKey="home"
                  label="Go Home"
                  onPress={onGoToHome}
                  icon={<HomeFilledIcon size={iconSize.small} color={theme.icon.default} />}
                />
              </View>
            </View>
            {enableDevMenuTools && devMenuItems && (
              <View padding="medium" style={{ paddingTop: 0 }}>
                <View bg="default" rounded="large">
                  {sortedDevMenuItems.map((key, i) => {
                    const item = devMenuItems[key];

                    const { label, isEnabled } = item;
                    return (
                      <Fragment key={key}>
                        <DevMenuItem
                          buttonKey={key}
                          label={label}
                          onPress={onPressDevMenuButton}
                          icon={MENU_ITEMS_ICON_MAPPINGS[key]}
                          isEnabled={isEnabled}
                        />
                        {i < sortedDevMenuItems.length - 1 && <Divider />}
                      </Fragment>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
      <DevMenuCloseButton onPress={collapseAndCloseDevMenuAsync} />
    </View>
  );
}
