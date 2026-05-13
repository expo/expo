import type { ListProps } from './types';

/**
 * A vertical container of rows.
 * Typically populated with [`ListItem`](#listitem) children.
 */
export function List({ children, testID }: ListProps) {
  return (
    <div style={containerStyle} data-testid={testID}>
      {children}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  overflow: 'auto',
};

export * from './types';
