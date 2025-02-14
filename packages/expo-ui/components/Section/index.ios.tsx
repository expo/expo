import { requireNativeView } from 'expo';
import { Children } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export type SectionProps = {
  title: string;
  /**
   *  Option to display the title in lower case letters
   * @default true
   */
  displayTitleUppercase?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const SectionNativeView: React.ComponentType<
  SectionProps & {
    heightOffset: number;
  }
> = requireNativeView('ExpoUI', 'SectionView');

const HOSTING_CONTAINER_OFFSET = 65;
const HORIZONTAL_PADDING = 20;

export function Section(props: SectionProps) {
  const children = Children.toArray(props.children);
  return (
    <SectionNativeView {...props} heightOffset={-HOSTING_CONTAINER_OFFSET}>
      <View
        collapsable={false}
        collapsableChildren={false}
        style={{ paddingBottom: HOSTING_CONTAINER_OFFSET }}>
        <View style={{ paddingHorizontal: HORIZONTAL_PADDING }}>
          {children.flatMap((c, idx) =>
            [
              <View
                onPointerDown={console.log}
                key={`section_${idx}`}
                style={{
                  minHeight: 50,
                  paddingHorizontal: 20,
                  justifyContent: 'center',
                  alignItems: 'stretch',
                }}>
                {c}
              </View>,
              idx !== children.length - 1 && (
                <View
                  key={`separator_${idx}`}
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: 'lightgray',
                    marginLeft: 20,
                  }}
                />
              ),
            ].filter((n) => !!n)
          )}
        </View>
      </View>
    </SectionNativeView>
  );
}