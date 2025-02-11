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
            <Button
              style={styles.button}
              systemImage={Platform.select({
                ios: 'folder.badge.plus',
                android: 'person',
              })}>
              Folder
            </Button>
            <Button
              style={styles.button}
              systemImage={Platform.select({
                ios: 'tortoise.fill',
                android: 'bug_report',
              })}>
              Tortoise
            </Button>
            <Button
              style={styles.button}
              systemImage={Platform.select({
                ios: 'trash',
                android: 'delete',
              })}>
              Trash
            </Button>
            <Button
              style={styles.button}
              systemImage={Platform.select({
                ios: 'heart.fill',
                android: 'favorite',
              })}>
              Heart
            </Button>
          </Section>
        </>
        {Platform.OS === 'android' && (
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
        )}
        <Section title="Tinted Buttons">
          <Button style={styles.button} color="#f00f0f">
            Red
          </Button>
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
