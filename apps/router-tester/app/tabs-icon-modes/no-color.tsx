import { TabIconModesScreen } from '../../components/tab-icon-modes';

export default function NoColorTab() {
  return (
    <TabIconModesScreen
      title="No color"
      description="No renderingMode and no icon color. Image: four colors on iOS, tinted on Android. Symbol: system rendering on iOS, a tinted md icon on Android."
    />
  );
}
