import { BranchIcon, UpdateIcon, iconSize, ChevronDownIcon } from '@expo/styleguide-native';
import format from 'date-fns/format';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import { WebContainerProjectPage_Query } from 'graphql/types';
import React from 'react';
import { Linking } from 'react-native';

import { DateFormats } from '../constants/DateFormats';
import * as UrlUtils from '../utils/UrlUtils';
import { PressableOpacity } from './PressableOpacity';

type Update =
  WebContainerProjectPage_Query['app']['byId']['updateBranches'][number]['updates'][number];

type Props = {
  name: string;
  latestUpdate: Update;
};

/**
 * This component is used to render a list item for the branches section on the project screen and on
 * the branches list page for an app.
 */

export function BranchListItem({
  name,
  latestUpdate: { message, manifestPermalink, createdAt },
}: Props) {
  const theme = useExpoTheme();

  const handlePressBranch = () => {
    // TODO: open branch page

    Linking.openURL(UrlUtils.normalizeUrl(manifestPermalink));
  };

  return (
    <PressableOpacity onPress={handlePressBranch}>
      <View padding="medium">
        <Row align="center" justify="between">
          <View align="start" flex="1">
            <Row align="center">
              <BranchIcon color={theme.icon.default} size={iconSize.small} />
              <Spacer.Horizontal size="tiny" />
              <Text ellipsizeMode="tail" numberOfLines={1} type="InterMedium">
                Branch: {name}
              </Text>
            </Row>
            {message && (
              <>
                <View flex="0" height="2" />
                <Row flex="1">
                  <Spacer.Horizontal size="medium" />
                  <UpdateIcon color={theme.icon.secondary} size={iconSize.small} />
                  <Spacer.Horizontal size="tiny" />
                  <View flex="1">
                    <Text
                      type="InterRegular"
                      color="secondary"
                      size="small"
                      ellipsizeMode="middle"
                      numberOfLines={1}>
                      Update: "{message}"
                    </Text>
                    <Spacer.Vertical size="tiny" />
                    <Text
                      type="InterRegular"
                      color="secondary"
                      size="small"
                      ellipsizeMode="tail"
                      numberOfLines={1}>
                      Published {format(new Date(createdAt), DateFormats.timestamp)}
                    </Text>
                  </View>
                </Row>
              </>
            )}
          </View>
          <Spacer.Horizontal size="tiny" />
          <ChevronDownIcon
            style={{ transform: [{ rotate: '-90deg' }] }}
            color={theme.icon.secondary}
          />
        </Row>
      </View>
    </PressableOpacity>
  );
}
