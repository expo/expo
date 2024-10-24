import { mergeClasses } from '@expo/styleguide';
import { Tab as ReachTab } from '@reach/tabs';
import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';
import { ComponentType, ReactElement } from 'react';

import { P } from '../Text';

import { TextComponentProps } from '~/ui/components/Text/types';

export type TabProps = {
  label: string;
  active: boolean;
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
            theme === 'secondary' && 'border-button-secondary bg-default shadow-xs dark:bg-subtle'
          )}
        />
      )}
      <ReachTab
        disabled={disabled}
        className={mergeClasses(
          'relative z-10 rounded-md transition-colors',
          !active && theme === 'default' && 'hocus:bg-selected dark:hocus:bg-element',
          !active && theme === 'secondary' && 'hocus:bg-element dark:hocus:bg-subtle',
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
            className="transition-colors max-md-gutters:text-sm max-sm-gutters:text-xs">
            {label}
          </LabelElement>
          {rightSlot}
        </div>
      </ReachTab>
    </div>
  );
}
