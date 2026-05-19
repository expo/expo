import { Drawer } from 'vaul';

import type { BottomSheetProps, SnapPoint } from './types';
import { useColorScheme } from 'react-native';

// Visually-hidden style for the screen-reader-only Drawer.Title.
const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

function snapPointToVaul(snapPoint: SnapPoint): string | number {
  if (snapPoint === 'half') return 0.5;
  if (snapPoint === 'full') return 1;
  if ('fraction' in snapPoint) return snapPoint.fraction;
  return `${snapPoint.height}px`;
}

/**
 * A modal sheet that slides up from the bottom of the screen.
 */
export function BottomSheet({
  children,
  isPresented,
  onDismiss,
  showDragIndicator = true,
  snapPoints,
  testID,
}: BottomSheetProps) {
  const isDark = useColorScheme() === 'dark';
  const vaulSnapPoints = snapPoints?.length ? snapPoints.map(snapPointToVaul) : undefined;
  const hasSnapPoints = vaulSnapPoints != null;

  return (
    <Drawer.Root
      open={isPresented}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      snapPoints={vaulSnapPoints}>
      <Drawer.Portal>
        <Drawer.Overlay style={overlayStyle} />
        <Drawer.Content
          style={{
            ...contentStyle,
            ...(isDark && { backgroundColor: '#000' }),
            // Snap-points mode: vaul translates the drawer by `viewport - snapHeight`.
            // The drawer has to fill the viewport or it gets pushed off-screen.
            ...(hasSnapPoints ? snapPointContentStyle : noSnapPointContentStyle),
            ...(showDragIndicator && dragIndicatorSpacing),
          }}
          aria-describedby={undefined}>
          {/* Radix Dialog requires a title for a11y; render visually-hidden. */}
          <Drawer.Title style={visuallyHiddenStyle}>Bottom sheet</Drawer.Title>
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
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
};

const snapPointContentStyle: React.CSSProperties = {
  height: '96vh',
};

const noSnapPointContentStyle: React.CSSProperties = {
  maxHeight: '85vh',
};

const innerStyle: React.CSSProperties = {
  padding: 16,
  overflow: 'auto',
};

const dragIndicatorSpacing: React.CSSProperties = {
  paddingTop: 16,
};

export * from './types';
