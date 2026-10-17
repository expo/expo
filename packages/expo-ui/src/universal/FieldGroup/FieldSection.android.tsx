import {
  Column as ComposeColumn,
  Text as ComposeText,
  ListItem,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { clickable, clip, fillMaxWidth, padding, Shapes } from '@expo/ui/jetpack-compose/modifiers';
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

import { ListItem as UniversalListItem, type ListItemProps } from '../ListItem';
import { useUniversalLifecycle } from '../hooks';
import { transformToModifiers } from '../transformStyle';
import { extractFieldSectionSlots } from './FieldSectionSlots';
import { getFieldItemPosition, type FieldItemPosition, type FieldSectionProps } from './types';

/**
 * Android implementation of [`FieldGroup.Section`](#fieldgroupsection). Each
 * row is a Jetpack Compose `ListItem` clipped to a position-aware rounded
 * shape, producing the Material 3 "connected list" look — fully rounded at
 * the section's ends, slightly rounded between rows, with a 2dp gap. All
 * colors adapt to the enclosing `<Host>`'s theme.
 */
export function FieldSection({
  children,
  title,
  style,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  titleUppercase = false,
  modifiers: extraModifiers,
}: FieldSectionProps) {
  useUniversalLifecycle(onAppear, onDisappear);
  const colors = useMaterialColors();

  if (hidden) return null;

  const { header, footer, rows } = extractFieldSectionSlots(children);

  const outerModifiers = transformToModifiers(style, { disabled, hidden, testID }, [
    fillMaxWidth(),
    ...(extraModifiers ?? []),
  ]);

  const headerNode =
    header ??
    (title ? (
      <ComposeText
        color={colors.onSurfaceVariant}
        style={{
          typography: 'titleMedium',
          letterSpacing: titleUppercase ? 0.5 : undefined,
        }}>
        {titleUppercase ? title.toUpperCase() : title}
      </ComposeText>
    ) : null);

  return (
    <ComposeColumn verticalArrangement={{ spacedBy: 4 }} modifiers={outerModifiers}>
      {headerNode ? (
        <ComposeColumn modifiers={[padding(16, 0, 16, 8)]}>{headerNode}</ComposeColumn>
      ) : null}
      {rows.length > 0 ? (
        <ComposeColumn verticalArrangement={{ spacedBy: 2 }} modifiers={[fillMaxWidth()]}>
          {rows.map((child, index) => {
            const position = getFieldItemPosition(index, rows.length);
            const rowModifiers = [
              fillMaxWidth(),
              clip(Shapes.RoundedCorner(cornerRadii(position))),
            ];
            if (isUniversalListItem(child)) {
              // A `ListItem` already renders a Compose `ListItem`. Style it as the row instead of
              // nesting it in another one, which would draw a second surface with its own padding.
              const { onPress, modifiers, colors: itemColors } = child.props;
              return cloneElement(child, {
                key: index,
                onPress: undefined,
                colors: { containerColor: colors.surfaceContainer, ...itemColors },
                // Clip before `clickable` so the ripple follows the rounded row.
                modifiers: [
                  ...rowModifiers,
                  ...(onPress ? [clickable(onPress)] : []),
                  ...(modifiers ?? []),
                ],
              });
            }
            return (
              <ListItem
                key={index}
                colors={{ containerColor: colors.surfaceContainer }}
                modifiers={rowModifiers}>
                <ListItem.HeadlineContent>{child}</ListItem.HeadlineContent>
              </ListItem>
            );
          })}
        </ComposeColumn>
      ) : null}
      {footer ? <ComposeColumn modifiers={[padding(16, 4, 16, 0)]}>{footer}</ComposeColumn> : null}
    </ComposeColumn>
  );
}

function isUniversalListItem(node: ReactNode): node is ReactElement<ListItemProps> {
  return isValidElement(node) && node.type === UniversalListItem;
}

/**
 * Per-position corner radii used to produce the Material 3 grouped-list look.
 *
 * - `only`: all four corners fully rounded (single-item section)
 * - `leading`: top corners fully rounded, bottom corners slightly rounded
 * - `trailing`: bottom corners fully rounded, top corners slightly rounded
 * - `middle`: all four corners slightly rounded
 */
function cornerRadii(position: FieldItemPosition) {
  const full = 20;
  const small = 4;
  switch (position) {
    case 'only':
      return { topStart: full, topEnd: full, bottomStart: full, bottomEnd: full };
    case 'leading':
      return { topStart: full, topEnd: full, bottomStart: small, bottomEnd: small };
    case 'trailing':
      return { topStart: small, topEnd: small, bottomStart: full, bottomEnd: full };
    case 'middle':
    default:
      return { topStart: small, topEnd: small, bottomStart: small, bottomEnd: small };
  }
}
