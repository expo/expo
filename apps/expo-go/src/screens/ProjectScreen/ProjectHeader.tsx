import { Row, useExpoTheme, View, Text, padding } from 'expo-dev-client-components';
import * as React from 'react';

import { CappedWidthContainerView } from '../../components/Views';
import { ProjectsQuery } from '../../graphql/types';

type ProjectPageApp = ProjectsQuery['app']['byId'];

export function ProjectHeader(props: { app: ProjectPageApp }) {
  const theme = useExpoTheme();
  console.log(padding.padding.medium);
  return (
    <CappedWidthContainerView
      wrapperStyle={{
        backgroundColor: theme.background.default,
        borderColor: theme.border.default,
        borderBottomWidth: 1,
        ...padding.padding.medium,
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
    </CappedWidthContainerView>
  );
}
