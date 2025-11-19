import { Children, isValidElement, type ReactElement } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';

export function isChildOfType<PropsT>(
  element: React.ReactNode,
  type: (props: PropsT) => unknown
): element is ReactElement<PropsT> {
  return isValidElement(element) && element.type === type;
}

export function getFirstChildOfType<PropsT>(
  children: React.ReactNode | React.ReactNode[],
  type: (props: PropsT) => unknown
) {
  return Children.toArray(children).find((child) => isChildOfType(child, type));
}

type NumericFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type ConvertedFontWeightType = Exclude<TextStyle['fontWeight'], number> | `${NumericFontWeight}`;

export function convertTextStyleToRNTextStyle<BaseStyleType extends Pick<TextStyle, 'fontWeight'>>(
  style: StyleProp<BaseStyleType | undefined>
):
  | (Omit<BaseStyleType, 'fontWeight'> & {
      fontWeight?: ConvertedFontWeightType;
    })
  | undefined {
  const flattenedStyle = StyleSheet.flatten(style) as BaseStyleType | undefined;
  if (!flattenedStyle) {
    return undefined;
  }
  if ('fontWeight' in flattenedStyle) {
    return {
      ...flattenedStyle,
      fontWeight:
        typeof flattenedStyle.fontWeight === 'number'
          ? (String(flattenedStyle.fontWeight) as `${NumericFontWeight}`)
          : flattenedStyle.fontWeight,
    };
  }
  return flattenedStyle as Omit<BaseStyleType, 'fontWeight'>;
}
