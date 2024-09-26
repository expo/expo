import * as Haptics from 'expo-haptics';
import { SectionList, SectionListData, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import MonoText from '../components/MonoText';
import Colors from '../constants/Colors';

type SectionData =
  | object
  | {
      accessor: string;
      value: any;
    };

const sections: SectionListData<SectionData>[] = [
  {
    methodName: 'notificationAsync',
    method: Haptics.notificationAsync,
    data: [
      {
        accessor: 'Haptics.NotificationFeedbackType.Success',
        value: Haptics.NotificationFeedbackType.Success,
      },
      {
        accessor: 'Haptics.NotificationFeedbackType.Warning',
        value: Haptics.NotificationFeedbackType.Warning,
      },
      {
        accessor: 'Haptics.NotificationFeedbackType.Error',
        value: Haptics.NotificationFeedbackType.Error,
      },
    ],
  },
  {
    methodName: 'impactAsync',
    method: Haptics.impactAsync,
    data: [
      {
        accessor: 'Haptics.ImpactFeedbackStyle.Light',
        value: Haptics.ImpactFeedbackStyle.Light,
      },
      {
        accessor: 'Haptics.ImpactFeedbackStyle.Medium',
        value: Haptics.ImpactFeedbackStyle.Medium,
      },
      {
        accessor: 'Haptics.ImpactFeedbackStyle.Heavy',
        value: Haptics.ImpactFeedbackStyle.Heavy,
      },
      {
        accessor: 'Haptics.ImpactFeedbackStyle.Soft',
        value: Haptics.ImpactFeedbackStyle.Soft,
      },
      {
        accessor: 'Haptics.ImpactFeedbackStyle.Rigid',
        value: Haptics.ImpactFeedbackStyle.Rigid,
      },
    ],
  },
  {
    methodName: 'selectionAsync',
    method: Haptics.selectionAsync,
    data: [{}],
  },
];

export default function HapticsScreen() {
  const renderItem = ({
    item,
    section: { method },
  }: {
    item: { accessor: string; value: any };
    section: { method: (type: string) => void };
  }) => <Item method={method} type={item} />;

  const renderSectionHeader = ({
    section: { methodName },
  }: {
    section: { methodName: string };
  }) => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>{methodName}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        style={styles.list}
        sections={sections}
        renderItem={renderItem as any}
        renderSectionHeader={renderSectionHeader as any}
        keyExtractor={(data: SectionData) => {
          if ('accessor' in data && 'value' in data) {
            return `key-${data.accessor}-${data.value}`;
          }
          return 'key-undefined';
        }}
      />
    </View>
  );
}

HapticsScreen.navigationOptions = {
  title: 'Haptics Feedback',
};

function Item({
  method,
  type: { value, accessor },
}: {
  method: (type: string) => void;
  type: { accessor: string; value: any };
}) {
  return (
    <View style={styles.itemContainer}>
      <Button
        onPress={() => {
          method(value);
        }}
        style={styles.button}
        title="Run"
      />

      <MonoText containerStyle={styles.itemText}>{`Haptics.${method.name}(${
        accessor || ''
      })`}</MonoText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerContainer: {
    alignItems: 'stretch',
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: Colors.greyBackground,
  },
  headerText: {
    color: Colors.tintColor,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    borderWidth: 0,
    flex: 1,
    marginVertical: 8,
    paddingVertical: 18,
    paddingLeft: 12,
  },
  button: {
    marginRight: 16,
  },
});
