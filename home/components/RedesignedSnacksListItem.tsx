import { ChevronDownIcon } from '@expo/styleguide-native';
import { PressableOpacity } from 'components/PressableOpacity';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';
import { Linking, Share } from 'react-native';

import * as UrlUtils from '../utils/UrlUtils';

type Props = {
  url: string;
  name: string;
  description?: string;
  isDraft: boolean;
};

function normalizeDescription(description?: string): string | undefined {
  return !description || description === 'No description' ? undefined : description;
}

/**
 * This component is used to render a list item for the snacks section on the homescreen and on
 * the snacks list page for an account.
 */

export function RedesignedSnacksListItem({ description, isDraft, name, url }: Props) {
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
    <PressableOpacity onPress={handlePressProject} onLongPress={handleLongPressProject}>
      <View padding="medium">
        <Row align="center" justify="between">
          <View align="start">
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
    </PressableOpacity>
  );
}
