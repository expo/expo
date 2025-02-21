import { List } from '@expo/ui/components/List';
import * as React from 'react';

import { Page, Section } from '../../components/Page';

export default function ListScreen() {
  return (
    <Page>
      <Section title="Standard List" gap={16}>
        <List style={{ height: 200 }} />
      </Section>
    </Page>
  );
}

ListScreen.navigationOptions = {
  title: 'List',
};
