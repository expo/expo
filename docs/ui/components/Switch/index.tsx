import { ButtonBase, mergeClasses } from '@expo/styleguide';
import { motion, useReducedMotion } from 'framer-motion';

type Props = {
  value?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
};

export function Switch({ value = false, size = 'md', onChange, disabled }: Props) {
  const shouldReduceMotion = useReducedMotion();

  function onClick(value: boolean) {
    if (disabled || !onChange) return;
    onChange(value);
  }

  return (
    <ButtonBase
      role="switch"
      className={mergeClasses(
        'flex justify-start rounded-full border border-default bg-palette-gray4 outline-offset-2',
        size === 'md' && 'h-6 min-w-[44px]',
        size === 'sm' && 'h-5 min-w-[36px]',
        value && 'justify-end border-palette-blue10 bg-palette-blue10',
        disabled && 'opacity-50',
        !shouldReduceMotion && 'transition-colors'
      )}
      aria-label="Switch"
      aria-checked={value}
      data-value={value}
      onClick={() => onClick(!value)}>
      <motion.div
        className={mergeClasses(
          'm-px rounded-full bg-palette-white shadow-xs dark:bg-palette-gray11',
          size === 'md' && 'h-5 min-w-[20px]',
          size === 'sm' && 'h-4 min-w-[16px]',
          value && 'dark:bg-palette-white',
          !shouldReduceMotion && 'transition-colors'
        )}
        layout
        transition={{
          type: 'linear',
        }}
      />
    </ButtonBase>
  );
}
