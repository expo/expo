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
    if (disabled || !onChange) {
      return;
    }
    onChange(value);
  }

  return (
    <ButtonBase
      role="switch"
      className={mergeClasses(
        'border-default bg-palette-gray4 flex justify-start rounded-full border outline-offset-2',
        size === 'md' && 'h-6 min-w-[44px]',
        size === 'sm' && 'h-5 min-w-[36px]',
        value && 'border-palette-blue10 bg-palette-blue10 justify-end',
        disabled && 'opacity-50',
        !shouldReduceMotion && 'transition-colors'
      )}
      aria-label="Switch"
      aria-checked={value}
      data-value={value}
      onClick={() => {
        onClick(!value);
      }}>
      <motion.div
        className={mergeClasses(
          'bg-palette-white dark:bg-palette-gray11 m-px rounded-full shadow-xs',
          size === 'md' && 'h-5 min-w-[20px]',
          size === 'sm' && 'h-4 min-w-[16px]',
          value && 'dark:bg-palette-white',
          !shouldReduceMotion && 'transition-colors'
        )}
        layout
        transition={{
          ease: 'linear',
        }}
      />
    </ButtonBase>
  );
}
