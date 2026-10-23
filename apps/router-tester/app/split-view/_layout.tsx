import { Link, useGlobalSearchParams, useRouter } from 'expo-router';
import { SplitView } from 'expo-router/unstable-split-view';
import React, { useEffect } from 'react';
import { PlatformColor, Pressable, ScrollView, Text, View } from 'react-native';
// Available starting from react-native-screens@4.17.0
// import { SafeAreaView } from 'react-native-screens/experimental';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setSpikeConfig, useSpikeConfig } from '../../utils/split-view-spike';

const passkeys = ['Github', 'Google', 'Facebook', 'Twitter', 'Apple', 'Microsoft', 'Amazon'];
const security = ['Admin1234', 'Root'];

const all = [...passkeys, ...security];

export default function Layout() {
  const config = useSpikeConfig();
  // The sidebar with the controls is hidden while the inspector is shown, so the inspector unmounts itself.
  useEffect(() => {
    if (config.inspector) {
      const timeout = setTimeout(() => setSpikeConfig({ inspector: false }), 2500);
      return () => clearTimeout(timeout);
    }
  }, [config.inspector]);
  return (
    <SplitView
      preferredDisplayMode="twoBesideSecondary"
      displayModeButtonVisibility="always"
      // primaryEdge="trailing"
      showSecondaryToggleButton={config.showSecondaryToggleButton}
      showInspector={config.inspector}
      preferredSplitBehavior="tile"
      detailOptions={{
        title: 'Detail',
        headerShown: config.detailHeaderShown,
        headerLargeTitle: config.headerLargeTitle,
      }}>
      <SplitView.Column
        options={{
          title: 'Sidebar',
          headerShown: config.sidebarHeaderShown,
          headerLargeTitle: config.headerLargeTitle,
        }}>
        <SafeAreaView
          // edges={{ top: true, left: true }}
          edges={['left', 'top']}
          style={{
            flex: 1,
            flexWrap: 'wrap',
            gap: 8,
            flexDirection: 'row',
            padding: 8,
          }}>
          <PasscodeCard title="All" param="all" />
          <PasscodeCard title="Passkeys" param="passkeys" />
          <PasscodeCard title="Codes" param="codes" />
          <PasscodeCard title="Security" param="security" />
          <PasscodeCard title="Deleted" param="deleted" />
          <SpikeControls />
        </SafeAreaView>
      </SplitView.Column>
      <SplitView.Column
        options={{
          title: 'List',
          headerShown: config.sidebarHeaderShown,
          headerLargeTitle: config.headerLargeTitle,
        }}>
        <PasswordElementList />
      </SplitView.Column>
      {config.inspector && (
        <SplitView.Inspector>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Inspector</Text>
          </View>
        </SplitView.Inspector>
      )}
    </SplitView>
  );
}

function PasswordElementList() {
  const params = useGlobalSearchParams();
  const data = (() => {
    switch (params.type) {
      case 'all':
      case undefined:
        return all;
      case 'passkeys':
        return passkeys;
      case 'security':
        return security;
      default:
        return [];
    }
  })();
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: undefined }}>
      {data.map((item) => (
        <PasswordElement key={item} title={item} />
      ))}
    </ScrollView>
  );
}

function PasscodeCard({ param, title }: { param: string; title: string }) {
  const params = useGlobalSearchParams();
  const isActive = params.type === param;
  return (
    <Link
      href={`/split-view/${param}/`}
      // TODO: If we want to remove disable, we need to use TabSlot in SplitView (for this to work, we need to support multiple screens for the same dynamic route)
      disabled={isActive}
      asChild>
      <Pressable
        style={{
          width: '48%',
          padding: 12,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          height: 50,
          backgroundColor: isActive ? PlatformColor('systemBlue') : PlatformColor('systemGray6'),
        }}>
        <Text style={{ color: isActive ? 'white' : 'black', fontSize: 16 }}>{title}</Text>
      </Pressable>
    </Link>
  );
}

function PasswordElement({ title }: { title: string }) {
  const params = useGlobalSearchParams();
  const isActive = params.id === title;
  return (
    <Link href={`/split-view/${params.type}/${title}/`} asChild>
      <Pressable
        style={{
          backgroundColor: isActive ? PlatformColor('systemBlue') : undefined,
          padding: 12,
        }}>
        {/* <SafeAreaView edges={{ left: true }}> */}
        <SafeAreaView edges={['left']}>
          <Text style={{ color: isActive ? 'white' : 'black', fontSize: 16 }}>{title}</Text>
        </SafeAreaView>
      </Pressable>
    </Link>
  );
}

function SpikeControls() {
  const config = useSpikeConfig();
  const router = useRouter();
  const toggles = [
    ['toggle-secondary-button', 'showSecondaryToggleButton', config.showSecondaryToggleButton],
    ['toggle-inspector', 'inspector', config.inspector],
    ['toggle-detail-header', 'detailHeaderShown', config.detailHeaderShown],
    ['toggle-sidebar-header', 'sidebarHeaderShown', config.sidebarHeaderShown],
  ] as const;
  return (
    <View style={{ gap: 4, width: '100%' }}>
      {toggles.map(([label, key, value]) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={label}
          // Header options cycle undefined (not set) -> true -> false.
          onPress={() =>
            setSpikeConfig({
              [key]:
                key === 'showSecondaryToggleButton' || key === 'inspector'
                  ? !value
                  : value === undefined
                    ? true
                    : value
                      ? false
                      : undefined,
            })
          }
          style={{ padding: 6, backgroundColor: PlatformColor('systemGray5') }}>
          <Text>
            {key}: {String(value)}
          </Text>
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="spike-back"
        onPress={() => router.replace('/split-view-spike')}
        style={{ padding: 6, backgroundColor: PlatformColor('systemGray5') }}>
        <Text>Back</Text>
      </Pressable>
    </View>
  );
}
