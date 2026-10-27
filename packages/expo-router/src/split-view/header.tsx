import type { SplitViewHeader } from './elements';
import { SplitViewNativeHeader } from './native';

export function SplitViewColumnHeader({ header }: { header: SplitViewHeader }) {
  const { title, largeTitle, leftToolbar, rightToolbar } = header;
  return (
    <SplitViewNativeHeader
      title={title}
      largeTitle={largeTitle}
      leftToolbarItems={leftToolbar?.map(({ title, icon }) => ({ title, icon }))}
      rightToolbarItems={rightToolbar?.map(({ title, icon }) => ({ title, icon }))}
      onToolbarItemPress={({ nativeEvent: { side, index } }) => {
        const items = side === 'left' ? leftToolbar : rightToolbar;
        items?.[index]?.onPress();
      }}
    />
  );
}
