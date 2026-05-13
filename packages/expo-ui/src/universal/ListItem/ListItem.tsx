import type { ReactNode } from 'react';

import { extractListItemSlots } from './ListItemSlots';
import type { ListItemProps } from './types';

function renderSupporting(node: ReactNode): ReactNode {
  if (typeof node === 'string') {
    return <span style={supportingTextStyle}>{node}</span>;
  }
  return node;
}

/**
 * A tappable row in a list.
 * Composes with [`List`](#list).
 * Pass row content via the `leading` / `trailing` / `supportingText` shorthand props or the compound `<ListItem.Leading>` / `<ListItem.Trailing>` / `<ListItem.Supporting>` slot children.
 */
export function ListItem(props: ListItemProps) {
  const {
    children,
    onPress,
    leading: leadingProp,
    trailing: trailingProp,
    supportingText,
    testID,
  } = props;
  const slots = extractListItemSlots(children);
  const leading = slots.leading ?? leadingProp;
  const trailing = slots.trailing ?? trailingProp;
  const supporting = slots.supporting ?? supportingText;

  return (
    <button type="button" onClick={onPress} style={rowStyle} data-testid={testID}>
      {leading != null ? <span style={slotStyle}>{leading}</span> : null}
      <span style={mainStyle}>
        <span>{slots.headline}</span>
        {supporting != null ? renderSupporting(supporting) : null}
      </span>
      {trailing != null ? <span style={slotStyle}>{trailing}</span> : null}
    </button>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '12px 16px',
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
};

const mainStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: 1,
  minWidth: 0,
};

const slotStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0,
};

const supportingTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#6b7280',
};

export * from './types';
