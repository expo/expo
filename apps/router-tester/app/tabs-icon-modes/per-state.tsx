import { TabIconModesScreen } from '../../components/tab-icon-modes';

export default function PerStateTab() {
  return (
    <TabIconModesScreen
      title="Per state"
      description="renderingMode={{ default: 'template', selected: 'original' }}. Image: tinted when unselected, four colors when selected. Symbol on iOS: monochrome when unselected, multicolor when selected."
    />
  );
}
