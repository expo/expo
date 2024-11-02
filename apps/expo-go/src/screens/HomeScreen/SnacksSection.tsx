import { ChevronDownIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Divider, Row, useExpoTheme, View, Text } from 'expo-dev-client-components';
import React, { Fragment } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { SnacksListItem } from '../../components/SnacksListItem';
import { CommonSnackDataFragment } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

type Props = {
  snacks: CommonSnackDataFragment[];
  showMore: boolean;
  accountName: string;
};

export function SnacksSection({ snacks, showMore, accountName }: Props) {
  const theme = useExpoTheme();

  const navigation = useNavigation<StackNavigationProp<HomeStackRoutes>>();

  function onSeeAllSnacksPress() {
    navigation.push('SnacksList', { accountName });
  }

  return (
    <View>
      {snacks.map((snack, i) => {
        if (!snack) return null;

        return (
          <Fragment key={snack.id}>
            <SnacksListItem
              id={snack.id}
              name={snack.name}
              sdkVersion={snack.sdkVersion}
              description={snack.description}
              isDraft={snack.isDraft}
              fullName={snack.fullName}
              first={i === 0}
              last={i === snacks.length - 1 && !showMore}
            />
            {i < snacks.length - 1 && <Divider style={{ height: 1 }} />}
          </Fragment>
        );
      })}
      {showMore && (
        <View border="default" roundedBottom="large">
          <TouchableOpacity onPress={onSeeAllSnacksPress}>
            <View padding="medium" bg="default" roundedBottom="large">
              <Row align="center" justify="between">
                <Text type="InterRegular">See all snacks</Text>
                <ChevronDownIcon
                  style={{ transform: [{ rotate: '-90deg' }] }}
                  color={theme.icon.secondary}
                />
              </Row>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
