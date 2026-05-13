import { Drawer } from 'vaul';

import type { BottomSheetProps } from './types';

/**
 * A modal sheet that slides up from the bottom of the screen.
 */
export function BottomSheet({
  children,
  isPresented,
  onDismiss,
  showDragIndicator = true,
  testID,
}: BottomSheetProps) {
  return (
    <Drawer.Root
      open={isPresented}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}>
      <Drawer.Portal>
        <Drawer.Overlay style={overlayStyle} />
        <Drawer.Content style={{ ...contentStyle, ...(showDragIndicator && dragIndicatorSpacing) }}>
          {showDragIndicator && <Drawer.Handle />}
          <div style={innerStyle} data-testid={testID}>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  zIndex: 50,
};

const contentStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'white',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  zIndex: 50,
  maxHeight: '85vh',
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
};

const innerStyle: React.CSSProperties = {
  padding: 16,
  overflow: 'auto',
};

const dragIndicatorSpacing: React.CSSProperties = {
  paddingTop: 16,
};

export * from './types';
