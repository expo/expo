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
        )}
        <Section title="Button Images">
          <Button
            variant="bordered"
            style={styles.button}
            systemImage={{
              ios: 'folder',
              android: 'filled.AccountBox',
            }}>
            Folder
          </Button>
          <Button
            variant="elevated"
            style={styles.button}
            systemImage={{
              ios: 'tortoise',
              android: 'filled.Warning',
            }}>
            Tortoise
          </Button>
          <Button
            variant="borderless"
            style={styles.button}
            systemImage={{
              ios: 'trash',
              android: 'outlined.Delete',
            }}
            elementColors={{ contentColor: '#FF6347' }}>
            Trash
          </Button>
          <Button
            variant="outlined"
            style={styles.button}
            systemImage={{
              ios: 'heart',
              android: 'outlined.Favorite',
            }}>
            Heart
          </Button>
        </Section>
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
