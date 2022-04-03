import { UpdateIcon, iconSize, ChevronDownIcon } from '@expo/styleguide-native';
import format from 'date-fns/format';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';
import { Linking } from 'react-native';

import { DateFormats } from '../constants/DateFormats';
import * as UrlUtils from '../utils/UrlUtils';
import { PressableOpacity } from './PressableOpacity';

type Props = {
  id: string;
  message?: string;
  createdAt: string;
  manifestPermalink: string;
};

export function UpdateListItem({ id, message, createdAt, manifestPermalink }: Props) {
  const theme = useExpoTheme();

  const handlePress = () => {
    Linking.openURL(UrlUtils.toExp(UrlUtils.normalizeUrl(manifestPermalink)));
  };

  return (
    <PressableOpacity
      containerProps={{
        bg: 'default',
        border: 'default',
        rounded: 'large',
      }}
      onPress={handlePress}>
      <View padding="medium">
        <Row align="center" justify="between">
          <View align="start" flex="1">
            <Row flex="1">
              <UpdateIcon color={theme.icon.secondary} size={iconSize.small} />
              <Spacer.Horizontal size="tiny" />
              <View flex="1">
                <Text
                  type="InterSemiBold"
                  color="secondary"
                  size="small"
                  ellipsizeMode="middle"
                  numberOfLines={1}>
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
              </View>
            </Row>
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
