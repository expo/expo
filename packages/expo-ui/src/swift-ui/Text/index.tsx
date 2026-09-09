import { requireNativeView } from 'expo';
import * as React from 'react';

import { createViewModifierEventListener } from '../modifiers/utils';
import { type ClosedRangeDate, type CommonViewModifierProps } from '../types';

/**
 * The style used to format a date in a SwiftUI `Text` view.
 */
export type TextDateStyle = 'timer' | 'relative' | 'offset' | 'date' | 'time' | 'components';

/**
 * The unit style of a `components` date, mirroring `Date.ComponentsFormatStyle.Style`.
 */
export type TextComponentsStyle =
  | 'spellOut'
  | 'wide'
  | 'abbreviated'
  | 'condensedAbbreviated'
  | 'narrow';

/**
 * A calendar unit a `components` date may be expressed in, mirroring `Date.ComponentsFormatStyle.Field`.
 */
export type TextComponentsField = 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';

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
   */
  date?: Date;

  /**
   * The style used to format the `date` prop.
   *
   * `components` shows the time between now and `date` in calendar units, such as `1 hr, 6 min`,
   * and updates live. It counts down to a future `date`, or up from a past one when `countsDown`
   * is `false`. Below iOS 18 it falls back to `relative`.
   * @default 'date'
   */
  dateStyle?: TextDateStyle;

  /**
   * How a `components` date names its units, for example `1 hr, 6 min` for `abbreviated`
   * or `1h 6m` for `narrow`.
   * @default 'abbreviated'
   * @platform ios 18.0+
   * @platform tvos 18.0+
   */
  componentsStyle?: TextComponentsStyle;

  /**
   * The calendar units a `components` date may use. Pass `['hour', 'minute']` for a countdown
   * without seconds. Defaults to the units SwiftUI picks for the interval.
   * @platform ios 18.0+
   * @platform tvos 18.0+
   */
  componentsFields?: TextComponentsField[];

  /**
   * A time interval to display as a live-updating timer.
   * @platform ios 16.0+
   * @platform tvos 16.0+
   */
  timerInterval?: ClosedRangeDate;

  /**
   * Whether the timer counts down (`true`) or up (`false`).
   * @default true
   * @platform ios 16.0+
   * @platform tvos 16.0+
   */
  countsDown?: boolean;

  /**
   * A date at which the timer should appear paused.
   * @platform ios 16.0+
   * @platform tvos 16.0+
   */
  pauseTime?: Date;
}

type NativeTextProps = CommonViewModifierProps & {
  text?: string;
  children?: React.ReactNode;
  markdownEnabled?: boolean;
  date?: number;
  dateStyle?: TextDateStyle;
  componentsStyle?: TextComponentsStyle;
  componentsFields?: TextComponentsField[];
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
