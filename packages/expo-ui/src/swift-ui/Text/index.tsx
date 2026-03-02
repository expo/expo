import { requireNativeView } from 'expo';
import * as React from 'react';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type CommonViewModifierProps } from '../types';

/**
 * The style used to format a date in a SwiftUI `Text` view.
 * @platform ios 14.0+
 */
export type TextDateStyle = 'timer' | 'relative' | 'offset' | 'date' | 'time';

export interface TextProps extends CommonViewModifierProps {
  /**
   * Text content or nested Text components.
   */
  children?: React.ReactNode;

  /**
   * Enables Markdown formatting for the text content using SwiftUI LocalizedStringKey.
   */
  markdownEnabled?: boolean;

  /**
   * A date to display using the specified `dateStyle`. The text auto-updates as time passes.
   * @platform ios 14.0+
   */
  date?: Date;

  /**
   * The style used to format the `date` prop.
   * @default 'date'
   * @platform ios 14.0+
   */
  dateStyle?: TextDateStyle;

  /**
   * A time interval to display as a live-updating timer.
   * @platform ios 16.0+
   */
  timerInterval?: { lower: Date; upper: Date };

  /**
   * Whether the timer counts down (`true`) or up (`false`).
   * @default true
   * @platform ios 16.0+
   */
  countsDown?: boolean;

  /**
   * A date at which the timer should appear paused.
   * @platform ios 16.0+
   */
  pauseTime?: Date;
}

type NativeTextProps = CommonViewModifierProps & {
  text?: string;
  children?: React.ReactNode;
  markdownEnabled?: boolean;
  date?: number;
  dateStyle?: TextDateStyle;
  timerInterval?: { lower: number; upper: number };
  countsDown?: boolean;
  pauseTime?: number;
};

const TextNativeView: React.ComponentType<NativeTextProps> = requireNativeView(
  'ExpoUI',
  'TextView'
);

export function Text(props: TextProps) {
  const { children, modifiers, date, timerInterval, pauseTime, ...restProps } = props;

  // Date/timer mode: pass converted timestamps to native, ignore children
  if (date != null || timerInterval != null) {
    return (
      <TextNativeView
        modifiers={modifiers}
        {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
        {...restProps}
        date={date ? date.getTime() : undefined}
        timerInterval={
          timerInterval
            ? {
                lower: timerInterval.lower.getTime(),
                upper: timerInterval.upper.getTime(),
              }
            : undefined
        }
        pauseTime={pauseTime ? pauseTime.getTime() : undefined}
      />
    );
  }

  if (children === undefined || children === null) {
    return null;
  }

  const childArray = React.Children.toArray(children);
  if (childArray.length === 0) return null;

  const isSimpleText = childArray.every(
    (child) => typeof child === 'string' || typeof child === 'number'
  );

  if (isSimpleText) {
    const combinedText = childArray.map(String).join('');
    return (
      <TextNativeView
        text={combinedText}
        modifiers={modifiers}
        {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
        {...restProps}
      />
    );
  }

  const finalChildren: React.ReactNode[] = [];

  let keyIndex = 0;

  for (const child of childArray) {
    if (typeof child === 'string' || typeof child === 'number') {
      finalChildren.push(<TextNativeView key={`text-${keyIndex++}`} text={String(child)} />);
    } else if (React.isValidElement(child) && child.type === Text) {
      finalChildren.push(child);
    }
  }

  return (
    <TextNativeView
      modifiers={modifiers}
      {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)}
      {...restProps}>
      {finalChildren}
    </TextNativeView>
  );
}
