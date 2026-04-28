import type { CheckboxProps } from './types';

/**
 * A toggle control that represents a checked or unchecked state.
 */
export function Checkbox({ value, onValueChange, label, disabled, testID }: CheckboxProps) {
  return (
    <label style={{ ...labelStyle, ...(disabled ? disabledStyle : undefined) }}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onValueChange(e.target.checked)}
        disabled={disabled}
        data-testid={testID}
      />
      {label != null && <span>{label}</span>}
    </label>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
};

const disabledStyle: React.CSSProperties = {
  opacity: 0.5,
  cursor: 'default',
};

export * from './types';
