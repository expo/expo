import { ChevronDownIcon } from '@expo/styleguide-native';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';
import { Linking, Share } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import * as UrlUtils from '../utils/UrlUtils';

type Props = {
  url: string;
  name: string;
  description?: string;
  isDraft: boolean;
  first: boolean;
  last: boolean;
};

function normalizeDescription(description?: string): string | undefined {
  return !description || description === 'No description' ? undefined : description;
}

/**
 * This component is used to render a list item for the snacks section on the homescreen and on
 * the snacks list page for an account.
 */

export function SnacksListItem({ description, isDraft, name, url, first, last }: Props) {
  const theme = useExpoTheme();

  const handlePressProject = () => {
    Linking.openURL(UrlUtils.normalizeUrl(url));
  };

  const handleLongPressProject = () => {
    const message = UrlUtils.normalizeUrl(url);
    Share.share({
      title: name,
      message,
      url: message,
    });
  };

  const normalizedDescription = normalizeDescription(description);

  return (
    <View
      border="default"
      roundedTop={first ? 'large' : undefined}
      roundedBottom={last ? 'large' : undefined}
      overflow="hidden"
      style={{
        borderBottomWidth: last ? 1 : 0,
        borderTopWidth: first ? 1 : 0,
      }}>
      <TouchableOpacity onPress={handlePressProject} onLongPress={handleLongPressProject}>
        <View
          padding="medium"
          bg="default"
          roundedTop={first ? 'large' : undefined}
          roundedBottom={last ? 'large' : undefined}>
          <Row align="center" justify="between">
            <View align="start" flex="1">
              <Text type="InterSemiBold" ellipsizeMode="tail" numberOfLines={1}>
                {name}
              </Text>
              {normalizedDescription && (
                <>
                  <Spacer.Vertical size="tiny" />
                  <Text type="InterSemiBold" size="small" ellipsizeMode="tail" numberOfLines={1}>
                    {normalizedDescription}
                  </Text>
                </>
              )}
              {isDraft && (
                <>
                  <Spacer.Vertical size="tiny" />
                  <View bg="secondary" rounded="medium" flex="0" padding="tiny" border="default">
                    <Text size="small" type="InterRegular">
                      Draft
                    </Text>
                  </View>
                </>
              )}
            </View>
            <ChevronDownIcon
              style={{ transform: [{ rotate: '-90deg' }] }}
              color={theme.icon.secondary}
            />
          </Row>
        </View>
      </TouchableOpacity>
    </View>
  );
}
