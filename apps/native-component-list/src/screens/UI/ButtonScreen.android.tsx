import { Button as JetpackButton, Host, Shape } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { ScrollView } from 'react-native';

import { Page, Section } from '../../components/Page';

function Button(props: React.ComponentProps<typeof JetpackButton>) {
  return (
    <Host>
      <JetpackButton {...props} />
    </Host>
  );
}

export default function UIScreen() {
  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Default">
          <Button>Test</Button>
        </Section>
        <Section title="System Styles">
          <Button variant="bordered">Bordered</Button>
          <Button variant="borderless">Borderless</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="elevated">Elevated</Button>
        </Section>
        <Section title="Disabled">
          <Button disabled>Disabled</Button>
          <Button>Enabled</Button>
        </Section>
        <Section title="Button Images">
          <Button variant="bordered" leadingIcon="filled.AccountBox">
            Folder
          </Button>
          <Button variant="elevated" leadingIcon="filled.Warning">
            Tortoise
          </Button>
          <Button
            variant="borderless"
            leadingIcon="outlined.Delete"
            elementColors={{ contentColor: '#FF6347' }}>
            Trash
          </Button>
          <Button variant="outlined" leadingIcon="outlined.Favorite" trailingIcon="filled.Favorite">
            Heart
          </Button>
        </Section>
        <Section title="Android Custom Colored Buttons">
          <Button elementColors={{ containerColor: '#007BFF', contentColor: '#FF6347' }}>
            Blue
          </Button>
          <Button elementColors={{ containerColor: '#FF6347', contentColor: '#007BFF' }}>
            Red
          </Button>
        </Section>
        <Section title="Tinted Buttons">
          <Button color="#f00f0f">Red</Button>
        </Section>
        <Section title="interpolated strings">
          <Button color="#FF6347">
            {/* eslint-disable-next-line */}
            Hello {'world'}
          </Button>
        </Section>
        <Section title="Custom shapes">
          <Button
            shape={Shape.PillStar({ innerRadius: 0.5, radius: 1, verticesCount: 20, smoothing: 1 })}
            leadingIcon="rounded.Check"
          />
        </Section>
      </ScrollView>
    </Page>
  );
}
