import { HomeFilledIcon, iconSize, RefreshIcon } from '@expo/styleguide-native';
import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import { Divider, useExpoTheme, View } from 'expo-dev-client-components';
import * as Font from 'expo-font';
import React, { Fragment, useContext, useEffect, useRef } from 'react';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UpgradeWarning } from 'src/screens/HomeScreen/UpgradeWarning';

import DevMenuBottomSheetContext from './DevMenuBottomSheetContext';
import { DevMenuCloseButton } from './DevMenuCloseButton';
import { DevMenuItem } from './DevMenuItem';
import * as DevMenu from './DevMenuModule';
import { DevMenuOnboarding } from './DevMenuOnboarding';
import { DevMenuServerInfo } from './DevMenuServerInfo';
import { DevMenuTaskInfo } from './DevMenuTaskInfo';
import { CappedWidthContainerView } from '../components/Views';
type Props = {
  task: { manifestUrl: string; manifestString: string };
  uuid: string;
};

// Base64 icon of the FAB, since the one from `assets` has issues loading.
const base64FabIcon = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAAACXBIWXMAACE4AAAhOAFFljFgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAfTSURBVHgB7VxdbttGEJ6hg0ZJC1Q5QdQT1D5BlBPEeYvdwKIfiih9kXMC2yew81Ib7YOpIrCN9CHuCcycwMoJwp6gDhDEclBxMkNSCrlckhL/5AD6ANnSiuSKH2dnZmdmF2CBVCDMCU/MbssAaBPhzwjUJIAWeC+8BKBL/z84/AvfEtDg1Dp0YA6olaBVc6t51x32CMEEn5AZgAMDR/0RGGd1klULQZ60EGyzlJhQAvhHWy7Cbh1EVUpQSGJ2oAIgwc7xX4e7UCEqI0ikhm/gHKYZSsi6hvUNerqHNRBgE/lFRMuQDYcfwMOqpKkSgtbM56tI7pHcKGg7pUtC7POQOxtCY3Bm7V/qjhMJbMBwGWVoEjyARLJZoSNsnlgHZ1AySidobeN5h2XfSvhanvYuk3KWREoaWCpNlsptSCLKQPPk6KAPJaJUgkRygOgN6Ht6eQWNnTzEqGCidgKiNP3g4zIlqTSCfEtFF+qwkuHk8o9mHWFDieD+2kzSEcSkCXn40kpZOsmAkiAKWaNzHCZnpWxyBHJNUc7SR/QbaspvEf0FJaAUgp5sdHV6oVLrIpBrSx9j6xdC6y4Mt6AEFB5igTl/r7YH5NhQA4Lhdh5tLWeoFZYgQ6Ms0fdybagJXl9sBKKt1DSSFPkMKESQSI9m+uB8gsY+1IzbbCHVocY6cbWoLroFBeDNxpU28XNy+jitW4Eec8G4PLZ+H8xyvsV98jVeRs0/NQNdtAM5UYggIugoTQ6LuwVT4inrjhHfED/5Zb5WczT5xoW1Tlfe2Dxc+8fKNdfN35YNcJuvlGHcYMn9DFe9sDUl3wPPjdxK2mTRvabhf5GLIVh8M5tZ566bvzIhS3v8tg3TYWIRmbjz8Xm6yeqa2d3nsdULt11h415eBzW3DrqG67baRuD+k3Xe+sazHpNzAdOTI/As5XqnexQ+T6IEMjSjh6KtnnwHPrUhJ3ITJMNCbbuCu3baOR45iLkV+DTxpNtw21bbEIxpogJa5CaINC5+mhh7Fi+JHAQ20+4LGUbBaxORcs2nLP83OErzfciJ/EqalE6RUq1O3JHzILplM8FnsmaKKYX7EicRvtpXF+Ae5ERpc7E0iKcLyVMRO+k8MftixWBGkOIPsSX6EXKikJmfFuzRdlR/iU3ei1PrwEk6R6wVuwBtmDNqkSB+pquRj6xz0mI2gcS14QagcoLEX4qHQTDVHeDUztQ+C0cnCwfg0lA5QUMYxuZCmvBEBH/LNCM2+YwDc05rZkFNQ2x2nFiHW+IBsyL/SfeS79hr34GKUbmS5vnR5TXLURissKdy3ALpqFRCslC5BOkcNyQqNIGsE/UMMYSIUmalvcwZkFJColWjFj9IEoTsrPWUxm0OW9hZcR9/5n/Li/FwCPVF3VUetUhQ4C3b0VaS1PJ5miTJ5BbIOPf9KOJsLV6Ula2YFrVIkEDmXPG8GTVZkvbYa+6hFxxz30mrS0v3EVwz7j9R8wdORUOM7OpQG0EyNHi4PESWCE3+zIttE40FWqaa2lie85Fz+VAjavWDjq0/2QF0Ncm+qeAgjh5X7RiqqN1RFJK8jOgMs3QJ5bJjuOIRXDNqG2JhBJbI9IoQALY4fvNArQVCxIELJO6BdTKn+kTBXAgaIyBqYsWCeqDm6RwJUTFXglTchKmFihs7Wb0pWBCUgQVBGVgQlIEFQRlYEJSBBUEZqM0PklIXAnfZhSUnKeUjx3AWtM1PzX6lSSh6SxtguMoz/WZdi1rqyaxudLc5CXjukrEnddQc3nivxnWkckOOIQ6kyf9fOs/2ItfgNPQdGl7w90dyHan2qCMqWTlBXn49vpglUoW6bnZNtXLDBdx66icQPRi6CntuqzqAVoAgjOa/iZJ+aEvX6EYzG9pjRhy7Hr8n7TFSYvdZe25ZyE8Q0ofwx6SFK5AQ+8FQO+umhPnXyAmd8E53xCf4zolfW4kM5Is/eShQQBXrtKUT96DYW13T5bBE7I8/nFh/7HPIY6B00Of2iTIPjncih2gyq/pUN/wLOVGggApjwaukUrdTyYAiPpYbkkIpCX6pFui4f7DiF07JMbIg5dBUruF8La6CXXmvy6wmlAbmDrTlNvNS6qZmTJnvNv/RmvDAtKdWjWVVyAakph7DuvCRWmqTVRqYhtwSFGRM7UgjYafutIwKUstmEOwicexCZp7F/K3S0ixrEUkeiLsAirVjwgotsCtEkBRux8r/CXvzkCLpk/RrM2wogEIEyTAjVIuhqPk9XRVeRDIrGu5QUtutcJtkQ+a+2odFOLaIRPWCq4b0pfHWxRktvGS8MEHyhFzEWDXYiPBNvAq+fEgfI39pZgRY0sYDpczFGv7yJyfa6i+NrJKklDpqp6zqs1II8nWRfmmk3EAVw02uKcUQoOodb02+t5a1FNS2LLysbSTEWt2hazYCpHUnRuyFv76Jy8LHCBb/HyV87YhuOJ5hTdkY42AZpWwsECxrsKBEzGVrCvD26QDb4Anpx4ytKaQeiBX+I329kA8ZVv+jsfn6W9iaYozZFqLIxHeyqRJ4hVWTDZcy8e1tbhJG6jYSBRHsA7JfZc1Q5QQJPGmShbXxNa65IB6yOIHf/AZLKnyiXM5KLHWm3BvoK9ALsvWrlph4t3OCT5bEnKnNSvb+ZFMlX/+IEhdCPvD/AUuLfZNqhhYI4Qunu5winQrSCAAAAABJRU5ErkJggg==',
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

function ThemedCustomIcon({ source }: { source: number | { uri: string } }) {
  const theme = useExpoTheme();
  return (
    <Image
      source={source}
      style={{ width: iconSize.regular, height: iconSize.regular }}
      tintColor={theme.icon.default}
    />
  );
}

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
  'dev-fab': <ThemedCustomIcon source={base64FabIcon} />,
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
      <CappedWidthContainerView wrapperStyle={{ backgroundColor: theme.background.default }}>
        <DevMenuTaskInfo task={task} />
        <DevMenuCloseButton onPress={collapseAndCloseDevMenuAsync} />
      </CappedWidthContainerView>
      <Divider />
      <View>
        {!isOnboardingFinished ? (
          <DevMenuOnboarding onClose={onOnboardingFinished} />
        ) : (
          <View style={{ paddingBottom: insets.bottom }}>
            <DevMenuServerInfo task={task} />
            <Divider />
            <CappedWidthContainerView>
              <View padding="medium" style={{ paddingBottom: 0 }}>
                <UpgradeWarning collapsible />
              </View>
              <View padding="medium" style={{ paddingTop: 0 }}>
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
            </CappedWidthContainerView>
          </View>
        )}
      </View>
    </View>
  );
}
