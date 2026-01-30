import { Icon, ListItem } from '@expo/ui/jetpack-compose';
import { clickable, clip, Shapes } from '@expo/ui/jetpack-compose/modifiers';
import { Color } from 'expo-router';

interface LanguageListItemProps {
  headline: string;
  supportingText?: string;
  selected: boolean;
  items: number;
  index: number;
  onClick: () => void;
}

export function LanguageListItem({
  headline,
  supportingText,
  selected,
  items,
  index,
  onClick,
}: LanguageListItemProps) {
  const colors = selected
    ? {
        containerColor: Color.android.dynamic.primaryContainer,
        leadingIconColor: Color.android.dynamic.primary,
      }
    : undefined;
  const clipShape = selected
    ? Shapes.Circle
    : Shapes.RoundedCorner({ topStart: 4, bottomEnd: 4, topEnd: 4, bottomStart: 4 });
  return (
    <ListItem
      headline={headline}
      supportingText={supportingText}
      colors={colors}
      modifiers={[clip(clipShape), clickable(onClick)]}>
      {selected && (
        <ListItem.Leading>
          <Icon source={require('@/assets/symbols/check.xml')} />
        </ListItem.Leading>
      )}
    </ListItem>
  );
}
