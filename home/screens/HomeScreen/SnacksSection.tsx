import { ChevronDownIcon } from '@expo/styleguide-native';
import { PressableOpacity } from 'components/PressableOpacity';
import { Divider, Row, useExpoTheme, View, Text } from 'expo-dev-client-components';
import { CommonSnackDataFragment } from 'graphql/types';
import React, { Fragment } from 'react';

import { SnacksListItem } from './SnacksListItem';

type Props = {
  snacks: CommonSnackDataFragment[];
  showMore: boolean;
};

export function SnacksSection({ snacks, showMore }: Props) {
  const theme = useExpoTheme();

  function onSeeAllSnacksPress() {
    // TODO(fiberjw): navigate to the snacks list page
    console.log('onSeeAllSnacksPress');
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
          <PressableOpacity onPress={onSeeAllSnacksPress}>
            <View padding="medium">
              <Row align="center" justify="between">
                <Text>See all snacks</Text>
                <ChevronDownIcon
                  style={{ transform: [{ rotate: '-90deg' }] }}
                  color={theme.icon.secondary}
                />
              </Row>
            </View>
          </PressableOpacity>
        </>
      )}
    </View>
  );
}
