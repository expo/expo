import { useId } from 'react';

import type { CollapsibleProps } from './types';

/**
 * A primitive that toggles visibility of its content via a labelled tappable
 * header. Controlled via `isOpen` + `onOpenChange`.
 */
export function Collapsible({ isOpen, onOpenChange, label = '', children }: CollapsibleProps) {
  const contentId = useId();

  return (
    <div style={containerStyle}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => onOpenChange(!isOpen)}
        style={summaryStyle}>
        <span>{label}</span>
        <span
          aria-hidden
          style={{
            ...chevronStyle,
            transform: `rotate(${isOpen ? 180 : 0}deg)`,
          }}>
          ▾
        </span>
      </button>
      <div
        id={contentId}
        role="region"
        aria-hidden={!isOpen}
        style={{
          ...gridWrapperStyle,
          gridTemplateRows: isOpen ? '1fr' : '0fr',
        }}>
        <div style={gridInnerStyle}>
          <div style={contentStyle}>{children}</div>
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
};

const summaryStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  width: '100%',
  cursor: 'pointer',
  padding: '12px 16px',
  userSelect: 'none',
  background: 'transparent',
  border: 'none',
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
};

const chevronStyle: React.CSSProperties = {
  display: 'inline-block',
  transition: 'transform 200ms ease',
  lineHeight: 1,
};

// Grid-row trick: animate `auto`-sized content height by transitioning the
// implicit row from `0fr` to `1fr`. The inner element needs `overflow: hidden`
// + `min-height: 0` so it actually collapses when the row is 0fr.
const gridWrapperStyle: React.CSSProperties = {
  display: 'grid',
  transition: 'grid-template-rows 200ms ease',
};

const gridInnerStyle: React.CSSProperties = {
  overflow: 'hidden',
  minHeight: 0,
};

const contentStyle: React.CSSProperties = {
  padding: '0 16px 12px',
};

export * from './types';
