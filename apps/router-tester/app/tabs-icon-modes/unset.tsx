import { TabIconModesScreen } from '../../components/tab-icon-modes';

export default function UnsetTab() {
  return (
    <TabIconModesScreen
      title="Not set"
      description="No renderingMode. Only the selected state has a color (selectedColor). Image on iOS: four colors when unselected, purple when selected. Image on Android: tinted in both states. Symbol: system rendering on iOS, a tinted md icon on Android."
    />
  );
}
