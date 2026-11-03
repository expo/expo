import { SettingsStackScreen } from '../../../components/settings-stack-screen';

export default function One() {
  return (
    <SettingsStackScreen
      title="One"
      links={['/split-view-navigation/settings/two', '/split-view-navigation/settings/three']}
    />
  );
}
