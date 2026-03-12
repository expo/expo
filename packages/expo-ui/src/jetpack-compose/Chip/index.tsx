import { requireNativeView } from 'expo';

import { type ModifierConfig } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

/**
 * Available text style variants for chip labels.
 */
export type ChipTextStyle =
  | 'labelSmall'
  | 'labelMedium'
  | 'labelLarge'
  | 'bodySmall'
  | 'bodyMedium'
  | 'bodyLarge';

// region AssistChip

export type AssistChipProps = {
  /**
   * The text label to display on the chip.
   */
  label: string;
  /**
   * Optional leading icon name (using Material Icons).
   */
  leadingIcon?: string;
  /**
   * Optional trailing icon name (using Material Icons).
   */
  trailingIcon?: string;
  /**
   * Size of the icon in density-independent pixels (dp).
   * @default 18
   */
  iconSize?: number;
  /**
   * Text style variant for the chip label.
   * @default 'labelSmall'
   */
  textStyle?: ChipTextStyle;
  /**
   * Whether the chip is enabled and can be clicked.
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback fired when the chip is clicked.
   */
  onPress?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeAssistChipProps = AssistChipProps;

const AssistChipNativeView: React.ComponentType<NativeAssistChipProps> = requireNativeView(
  'ExpoUI',
  'AssistChipView'
);

function transformAssistChipProps(props: AssistChipProps): NativeAssistChipProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * An assist chip that helps users complete actions and primary tasks.
 */
export function AssistChip(props: AssistChipProps) {
  return <AssistChipNativeView {...transformAssistChipProps(props)} />;
}

// endregion

// region InputChip

export type InputChipProps = {
  /**
   * The text label to display on the chip.
   */
  label: string;
  /**
   * Optional leading icon name (using Material Icons), displayed as an avatar.
   */
  leadingIcon?: string;
  /**
   * Optional trailing icon name (using Material Icons). Defaults to `filled.Close` if not specified.
   */
  trailingIcon?: string;
  /**
   * Size of the icon in density-independent pixels (dp).
   * @default 18
   */
  iconSize?: number;
  /**
   * Text style variant for the chip label.
   * @default 'labelSmall'
   */
  textStyle?: ChipTextStyle;
  /**
   * Whether the chip is enabled and can be interacted with.
   * @default true
   */
  enabled?: boolean;
  /**
   * Whether the chip is selected.
   * @default false
   */
  selected?: boolean;
  /**
   * Callback fired when the chip is clicked.
   */
  onPress?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeInputChipProps = InputChipProps;

const InputChipNativeView: React.ComponentType<NativeInputChipProps> = requireNativeView(
  'ExpoUI',
  'InputChipView'
);

function transformInputChipProps(props: InputChipProps): NativeInputChipProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * An input chip that represents user input and can be dismissed.
 */
export function InputChip(props: InputChipProps) {
  return <InputChipNativeView {...transformInputChipProps(props)} />;
}

// endregion

// region SuggestionChip

export type SuggestionChipProps = {
  /**
   * The text label to display on the chip.
   */
  label: string;
  /**
   * Optional icon name (using Material Icons).
   */
  leadingIcon?: string;
  /**
   * Size of the icon in density-independent pixels (dp).
   * @default 18
   */
  iconSize?: number;
  /**
   * Text style variant for the chip label.
   * @default 'labelSmall'
   */
  textStyle?: ChipTextStyle;
  /**
   * Whether the chip is enabled and can be clicked.
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback fired when the chip is clicked.
   */
  onPress?: () => void;
  /**
   * Modifiers for the component.
   */
  modifiers?: ModifierConfig[];
};

type NativeSuggestionChipProps = SuggestionChipProps;

const SuggestionChipNativeView: React.ComponentType<NativeSuggestionChipProps> = requireNativeView(
  'ExpoUI',
  'SuggestionChipView'
);

function transformSuggestionChipProps(props: SuggestionChipProps): NativeSuggestionChipProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * A suggestion chip that offers contextual suggestions and recommendations.
 */
export function SuggestionChip(props: SuggestionChipProps) {
  return <SuggestionChipNativeView {...transformSuggestionChipProps(props)} />;
}

// endregion
