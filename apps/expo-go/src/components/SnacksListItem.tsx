import { ChevronDownIcon } from '@expo/styleguide-native';
import { Row, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import React from 'react';
import { Alert, Linking } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import Environment from '../utils/Environment';
import * as UrlUtils from '../utils/UrlUtils';

type Props = {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  isDraft: boolean;
  first: boolean;
  last: boolean;
  sdkVersion?: string;
};

function normalizeDescription(description?: string): string | undefined {
  return !description || description === 'No description' ? undefined : description;
}

/**
 * This component is used to render a list item for the snacks section on the homescreen and on
 * the snacks list page for an account.
 */

export function SnacksListItem(snackData: Props) {
  const { fullName, name, description, isDraft, first, last, sdkVersion } = snackData;
  const theme = useExpoTheme();

  const normalizedDescription = normalizeDescription(description);
  const isSupported = sdkVersion ? sdkVersion === Environment.supportedSdksString : true;

  const handlePressProject = () => {
    if (isSupported) {
      Linking.openURL(UrlUtils.normalizeSnackUrl(fullName));
    } else {
      const expoGoMajorVersion = Environment.supportedSdksString?.split('.')[0];
      const snackMajorVersion = sdkVersion?.split('.')[0];
      if (expoGoMajorVersion && snackMajorVersion) {
        Alert.alert(
          `Selected Snack uses unsupported SDK (${snackMajorVersion})`,
          `The currently running version of Expo Go supports SDK ${expoGoMajorVersion} only. Update your Snack to this version to run it.`
        );
      } else {
        // Unlikely to hit this it's a good fallback case if we somehow get
        // invalid data from the Snack or environment
        Alert.alert(
          `Selected Snack uses unsupported SDK`,
          `Update your Snack to a compatible version to run it.`
        );
      }
    }
  };

  return (
    <View
      border="default"
      roundedTop={first ? 'large' : undefined}
      roundedBottom={last ? 'large' : undefined}
      overflow="hidden"
      style={[
        {
          borderBottomWidth: last ? 1 : 0,
          borderTopWidth: first ? 1 : 0,
        },
      ]}>
      <TouchableOpacity onPress={handlePressProject}>
        <View
          padding="medium"
          bg="default"
          roundedTop={first ? 'large' : undefined}
          roundedBottom={last ? 'large' : undefined}>
          <Row align="center" justify="between">
            <View align="start" flex="1">
              <Text
                type="InterSemiBold"
                ellipsizeMode="tail"
                numberOfLines={1}
                style={{ opacity: isSupported ? 1 : 0.5 }}>
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
              {!isSupported && (
                <>
                  <Spacer.Vertical size="tiny" />
                  <View bg="secondary" rounded="medium" flex="0" padding="tiny" border="default">
                    <Text size="small" type="InterRegular">
                      Unsupported SDK ({sdkVersion})
                    </Text>
                  </View>
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
