import {
  Section,
  ListItem,
  List,
  Host,
} from '@expo/ui/jetpack-compose';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ListScreen() {
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [aboutExpanded, setAboutExpanded] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>List, Section & ListItem</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collapsible Section</Text>
        <Host style={{ height: 400 }}>
          <List>
            <Section
              title="Settings"
              isExpanded={settingsExpanded}
              onIsExpandedChange={setSettingsExpanded}>
              <ListItem
                headline="Notifications"
                supportingText="Manage notification preferences"
                leadingIcon="filled.Notifications"
                trailingIcon="filled.KeyboardArrowRight"
                onPress={() => Alert.alert('Notifications', 'Opening notification settings')}
              />
              <ListItem
                headline="Privacy"
                supportingText="Control your data and visibility"
                leadingIcon="filled.Lock"
                trailingIcon="filled.KeyboardArrowRight"
                onPress={() => Alert.alert('Privacy', 'Opening privacy settings')}
              />
              <ListItem
                headline="Storage"
                supportingText="12.4 GB used of 64 GB"
                overlineText="Device"
                leadingIcon="filled.Settings"
                onPress={() => Alert.alert('Storage', 'Opening storage details')}
              />
            </Section>

            <Section
              title="About"
              isExpanded={aboutExpanded}
              onIsExpandedChange={setAboutExpanded}>
              <ListItem
                headline="Version"
                supportingText="1.0.0 (build 42)"
                leadingIcon="filled.Info"
              />
              <ListItem
                headline="Licenses"
                supportingText="Open source licenses"
                leadingIcon="filled.List"
                trailingIcon="filled.KeyboardArrowRight"
                onPress={() => Alert.alert('Licenses', 'Opening licenses')}
              />
            </Section>
          </List>
        </Host>
      </View>

      <Text style={styles.standaloneTitle}>Standalone ListItems</Text>
      <Host style={{ marginHorizontal: 20, height: 250 }}>
        <Section>
          <ListItem
            headline="Simple item"
            onPress={() => Alert.alert('Pressed', 'Simple item pressed')}
          />
          <ListItem
            headline="With icons"
            supportingText="Leading and trailing icons"
            leadingIcon="filled.Star"
            trailingIcon="filled.KeyboardArrowRight"
            onPress={() => Alert.alert('Pressed', 'Icon item pressed')}
          />
          <ListItem
            headline="Three-line item"
            supportingText="This is the supporting text"
            overlineText="OVERLINE"
            leadingIcon="filled.Person"
          />
        </Section>
      </Host>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  standaloneTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#333',
  },
});

ListScreen.navigationOptions = {
  title: 'List',
};
