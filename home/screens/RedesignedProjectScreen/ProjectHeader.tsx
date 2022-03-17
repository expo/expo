import { Row, useExpoTheme, View, Text, Spacer } from 'expo-dev-client-components';
import * as React from 'react';
import { Image, StyleSheet } from 'react-native';
import FadeIn from 'react-native-fade-in-image';

import { WebContainerProjectPage_Query } from '../../graphql/types';

type ProjectPageApp = WebContainerProjectPage_Query['app']['byId'];

export function ProjectHeader(props: { app: ProjectPageApp }) {
  const source = props.app.icon ? props.app.icon.url : props.app.iconUrl;

  const theme = useExpoTheme();
  return (
    <View
      bg="default"
      padding="medium"
      border="hairline"
      style={{
        borderColor: theme.border.default,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: 1,
      }}>
      <Row align="center">
        <View overflow="hidden" rounded="medium">
          <FadeIn>
            <Image
              source={source ? { uri: source } : require('../../assets/placeholder-app-icon.png')}
              style={{
                width: 48,
                height: 48,
              }}
            />
          </FadeIn>
        </View>
        <Spacer.Horizontal size="small" />
        <View>
          <Text size="large" type="InterSemiBold">
            {props.app.name}
          </Text>
          <Text color="secondary" size="small" type="InterRegular">
            {props.app.slug}
          </Text>
        </View>
      </Row>
    </View>
  );
}
