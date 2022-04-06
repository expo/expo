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
    <View bg="default" rounded="large" border="hairline" overflow="hidden">
      {snacks.map((snack, i) => {
        if (!snack) return null;

        return (
          <Fragment key={snack.id}>
            <SnacksListItem
              name={snack.name}
              description={snack.description}
              isDraft={snack.isDraft}
              url={snack.fullName}
            />
            {i < snacks.length - 1 && <Divider />}
          </Fragment>
        );
      })}
      {showMore && (
        <>
          <Divider />
          <TouchableOpacity onPress={onSeeAllSnacksPress}>
            <View padding="medium">
              <Row align="center" justify="between">
                <Text type="InterRegular">See all snacks</Text>
                <ChevronDownIcon
                  style={{ transform: [{ rotate: '-90deg' }] }}
                  color={theme.icon.secondary}
                />
              </Row>
            </View>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
