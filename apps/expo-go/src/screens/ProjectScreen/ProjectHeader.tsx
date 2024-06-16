import { Row, useExpoTheme, View, Text } from 'expo-dev-client-components';
import * as React from 'react';

import { ProjectsQuery } from '../../graphql/types';

type ProjectPageApp = ProjectsQuery['app']['byId'];

export function ProjectHeader(props: { app: ProjectPageApp }) {
  const theme = useExpoTheme();
  return (
    <View
      bg="default"
      padding="medium"
      style={{
        borderColor: theme.border.default,
        borderBottomWidth: 1,
      }}>
      <Row align="center">
        <View>
          <Text size="large" type="InterSemiBold">
            {props.app.name}
          </Text>
          <Text color="secondary" size="small" type="InterRegular">
            {props.app.slug}
          </Text>
          <Text color="secondary" size="small" type="InterRegular">
            Owned by {props.app.ownerAccount.name}
          </Text>
        </View>
      </Row>
    </View>
  );
}
