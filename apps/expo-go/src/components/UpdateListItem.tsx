import { UpdateIcon, iconSize, ChevronDownIcon } from '@expo/styleguide-native';
import format from 'date-fns/format';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';
import { Linking } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { BranchDetailsQuery } from 'src/graphql/types';

import { DateFormats } from '../constants/DateFormats';
import * as Kernel from '../kernel/Kernel';
import * as UrlUtils from '../utils/UrlUtils';

type Props = {
  update: NonNullable<BranchDetailsQuery['app']['byId']['updateBranchByName']>['updates'][0];
  first: boolean;
  last: boolean;
};

export function UpdateListItem({ update, first, last }: Props) {
  const { id, message, createdAt, manifestPermalink, expoGoSDKVersion } = update;

  const isCompatibleWithThisExpoGo =
    !!expoGoSDKVersion && Kernel.sdkVersionsArray.includes(expoGoSDKVersion);

  const theme = useExpoTheme();

  const handlePress = () => {
    Linking.openURL(UrlUtils.toExp(UrlUtils.normalizeUrl(manifestPermalink)));
  };

  return (
    <View
      border="default"
      roundedTop={first ? 'large' : undefined}
      roundedBottom={last ? 'large' : undefined}
      style={{
        borderBottomWidth: last ? 1 : 0,
        borderTopWidth: first ? 1 : 0,
      }}>
      <TouchableOpacity onPress={handlePress} disabled={!isCompatibleWithThisExpoGo}>
        <View
          padding="medium"
          bg="default"
          roundedTop={first ? 'large' : undefined}
          roundedBottom={last ? 'large' : undefined}>
          <Row align="center" justify="between">
            <View align="start" flex="1">
              <Row flex="1">
                <UpdateIcon color={theme.icon.default} size={iconSize.small} />
                <Spacer.Horizontal size="tiny" />
                <View flex="1">
                  <Text type="InterSemiBold" ellipsizeMode="middle" numberOfLines={1}>
                    {message ? `"${message}"` : id}
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
                  {!isCompatibleWithThisExpoGo && (
                    <>
                      <Spacer.Vertical size="tiny" />
                      <Text
                        type="InterRegular"
                        color="secondary"
                        size="small"
                        ellipsizeMode="tail"
                        numberOfLines={1}>
                        Not compatible with this version of Expo Go
                      </Text>
                    </>
                  )}
                </View>
              </Row>
            </View>
            <Spacer.Horizontal size="tiny" />
            {isCompatibleWithThisExpoGo && (
              <ChevronDownIcon
                style={{ transform: [{ rotate: '-90deg' }] }}
                color={theme.icon.secondary}
              />
            )}
          </Row>
        </View>
      </TouchableOpacity>
    </View>
  );
}
