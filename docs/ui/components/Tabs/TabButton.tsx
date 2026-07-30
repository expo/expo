import { mergeClasses } from '@expo/styleguide';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion, useReducedMotion } from 'framer-motion';
import { ComponentType, ReactElement } from 'react';

import { TextComponentProps } from '~/ui/components/Text/types';

import { P } from '../Text';

export type TabProps = {
  label: string;
  active: boolean;
  value: string;
  href?: string;
  icon?: ReactElement;
  disabled?: boolean;
  className?: string;
  layoutId?: string;
  rightSlot?: ReactElement;
  theme?: 'default' | 'secondary';
  LabelElement?: ComponentType<TextComponentProps>;
};

export function TabButton({
  label,
  active,
  value,
  disabled,
  icon,
  className,
  rightSlot,
  layoutId,
  theme = 'secondary',
  LabelElement = P,
}: TabProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative">
      {active && (
        <motion.div
          layoutId={`active-indicator-${layoutId}`}
          transition={{
            ease: 'linear',
            duration: shouldReduceMotion ? 0 : 0.2,
          }}
          className={mergeClasses(
            'absolute inset-0 rounded-md border',
            theme === 'default' && 'border-secondary bg-screen dark:bg-hover dark:drop-shadow-none',
            theme === 'secondary' && 'border-default bg-default shadow-sm dark:bg-subtle'
          )}
        />
      )}
      <TabsPrimitive.Trigger
        value={value}
        disabled={disabled}
        className={mergeClasses(
          'relative z-10 rounded-md transition-colors',
          !active && theme === 'default' && 'dark:hocus:bg-element hocus:bg-selected',
          !active && theme === 'secondary' && 'dark:hocus:bg-subtle hocus:bg-element',
          className
        )}>
        <div
          className={mergeClasses(
            'flex items-center gap-2 px-4 py-1.5',
            rightSlot && 'w-full justify-between'
          )}>
          {icon}
          <LabelElement
            theme={active ? 'default' : 'tertiary'}
            weight="medium"
            className="transition-colors max-md:text-sm max-sm:text-sm">
            {label}
          </LabelElement>
          {rightSlot}
        </div>
      </TabsPrimitive.Trigger>
    </div>
  );
}
