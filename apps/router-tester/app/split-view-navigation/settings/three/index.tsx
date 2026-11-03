import { SettingsStackScreen } from '../../../../components/settings-stack-screen';

export default function Three() {
  return (
    <SettingsStackScreen
      title="Three"
      links={['/split-view-navigation/settings/three/a', '/split-view-navigation/settings/three/b']}
    />
  );
}
