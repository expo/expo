import { Button } from '@expo/ui/components/Button';
import * as React from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

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
          {Platform.OS === 'ios' && (
            <>
              <Button style={styles.button} variant="borderedProminent">
                Bordered Prominent
              </Button>
              <Button style={styles.button} variant="plain">
                Plain
              </Button>
            </>
          )}
          {Platform.OS === 'android' && (
            <>
              <Button style={styles.button} variant="outlined">
                Outlined
              </Button>
              <Button style={styles.button} variant="elevated">
                Elevated
              </Button>
            </>
          )}
        </Section>
        {Platform.OS === 'ios' && (
          <>
            <Section title="Button Roles">
              <Button style={styles.button} role="default">
                Default
              </Button>
              <Button style={styles.button} role="cancel">
                Cancel
              </Button>
              <Button style={styles.button} role="destructive">
                Destructive
              </Button>
            </Section>

            <Section title="Button Images">
              <Button style={styles.button} systemImage="folder.badge.plus">
                Folder
              </Button>
              <Button style={styles.button} systemImage="tortoise.fill">
                Tortoise
              </Button>
              <Button style={styles.button} systemImage="trash">
                Trash
              </Button>
              <Button style={styles.button} systemImage="heart.fill">
                Heart
              </Button>
            </Section>
          </>
        )}
        {Platform.OS === 'android' && (
          <Section title="Colored Buttons">
            <Button
              style={styles.button}
              colors={{ containerColor: '#007BFF', contentColor: '#FFFFFF' }}>
              Blue
            </Button>
            <Button
              style={styles.button}
              colors={{ containerColor: '#FF6347', contentColor: '#FFFFFF' }}>
              Red
            </Button>
          </Section>
        )}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 120,
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
