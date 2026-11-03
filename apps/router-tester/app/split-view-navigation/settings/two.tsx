import { SettingsStackScreen } from '../../../components/settings-stack-screen';

export default function Two() {
  return (
    <SettingsStackScreen
      title="Two"
      links={['/split-view-navigation/settings/one', '/split-view-navigation/settings/three']}
    />
  );
}
