import {
  Column as ComposeColumn,
  Text as ComposeText,
  ListItem,
  useMaterialColors,
} from '@expo/ui/jetpack-compose';
import { clip, fillMaxWidth, padding, Shapes } from '@expo/ui/jetpack-compose/modifiers';

import { extractFieldSectionSlots } from './FieldSectionSlots';
import { getFieldItemPosition, type FieldItemPosition, type FieldSectionProps } from './types';
import { useUniversalLifecycle } from '../hooks';
import { transformToModifiers } from '../transformStyle';

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
            return (
              <ListItem
                key={index}
                colors={{ containerColor: colors.surfaceContainer }}
                modifiers={[fillMaxWidth(), clip(Shapes.RoundedCorner(cornerRadii(position)))]}>
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
