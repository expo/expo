import { Button, Shape } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function UIScreen() {
  return (
    <Page>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Section title="Default">
          <Button style={styles.button}>Test</Button>
        </Section>
        <Section title="System Styles">
          <Button style={styles.button} variant="default">
            Default
          </Button>
          <Button style={styles.button} variant="bordered">
            Bordered
          </Button>
          <Button style={styles.button} variant="borderless">
            Borderless
          </Button>
          <Button style={styles.button} variant="outlined">
            Outlined
          </Button>
          <Button style={styles.button} variant="elevated">
            Elevated
          </Button>
        </Section>
        <Section title="Disabled">
          <Button style={styles.button} disabled>
            Disabled
          </Button>
          <Button style={styles.button}>Enabled</Button>
        </Section>
        <Section title="Button Images">
          <Button variant="bordered" style={styles.button} leadingIcon="filled.AccountBox">
            Folder
          </Button>
          <Button variant="elevated" style={styles.button} leadingIcon="filled.Warning">
            Tortoise
          </Button>
          <Button
            variant="borderless"
            style={styles.button}
            leadingIcon="outlined.Delete"
            elementColors={{ contentColor: '#FF6347' }}>
            Trash
          </Button>
          <Button
            variant="outlined"
            style={styles.button}
            leadingIcon="outlined.Favorite"
            trailingIcon="filled.Favorite">
            Heart
          </Button>
        </Section>
        <Section title="Android Custom Colored Buttons">
          <Button
            style={styles.button}
            elementColors={{ containerColor: '#007BFF', contentColor: '#FF6347' }}>
            Blue
          </Button>
          <Button
            style={styles.button}
            elementColors={{ containerColor: '#FF6347', contentColor: '#007BFF' }}>
            Red
          </Button>
        </Section>
        <Section title="Tinted Buttons">
          <Button style={styles.button} color="#f00f0f">
            Red
          </Button>
        </Section>
        <Section title="interpolated strings">
          <Button style={styles.button} color="#FF6347">
            {/* eslint-disable-next-line */}
            Hello {'world'}
          </Button>
        </Section>
        <Section title="Custom shapes">
          <Button
            style={{ aspectRatio: 2, width: 200 }}
            shape={Shape.PillStar({ innerRadius: 0.5, radius: 1, verticesCount: 20 })}
            leadingIcon="rounded.Check"
          />
        </Section>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 150,
    margin: 5,
    overflow: 'visible',
  },
  stretch: {
    alignSelf: 'stretch',
  },
  columnWrapper: {
    justifyContent: 'space-around',
    alignContent: 'space-around',
  },
});
