import {
  ExtendedFloatingActionButton,
  FloatingActionButton,
  Host,
  Icon,
  LargeFloatingActionButton,
  SmallFloatingActionButton,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

const addIcon = require('../../../assets/icons/ui/add.xml');
const editIcon = require('../../../assets/icons/ui/edit.xml');

export default function FloatingActionButtonScreen() {
  const [extended, setExtended] = useState(true);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>FloatingActionButton</Text>
        <Text style={styles.subtitle}>Material Design 3 Floating Action Buttons</Text>

        {/* Standard FAB sizes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAB variants</Text>
          <View style={styles.row}>
            <View style={styles.fabWrapper}>
              <Text style={styles.label}>small</Text>
              <Host matchContents>
                <SmallFloatingActionButton onClick={() => Alert.alert('Small FAB pressed')}>
                  <SmallFloatingActionButton.Icon>
                    <Icon source={addIcon} />
                  </SmallFloatingActionButton.Icon>
                </SmallFloatingActionButton>
              </Host>
            </View>
            <View style={styles.fabWrapper}>
              <Text style={styles.label}>medium</Text>
              <Host matchContents>
                <FloatingActionButton onClick={() => Alert.alert('Medium FAB pressed')}>
                  <FloatingActionButton.Icon>
                    <Icon source={addIcon} />
                  </FloatingActionButton.Icon>
                </FloatingActionButton>
              </Host>
            </View>
            <View style={styles.fabWrapper}>
              <Text style={styles.label}>large</Text>
              <Host matchContents>
                <LargeFloatingActionButton onClick={() => Alert.alert('Large FAB pressed')}>
                  <LargeFloatingActionButton.Icon>
                    <Icon source={addIcon} />
                  </LargeFloatingActionButton.Icon>
                </LargeFloatingActionButton>
              </Host>
            </View>
          </View>
        </View>

        {/* Custom container colors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom container colors</Text>
          <View style={styles.row}>
            <View style={styles.fabWrapper}>
              <Text style={styles.label}>default</Text>
              <Host matchContents>
                <FloatingActionButton onClick={() => Alert.alert('Default FAB pressed')}>
                  <FloatingActionButton.Icon>
                    <Icon source={addIcon} />
                  </FloatingActionButton.Icon>
                </FloatingActionButton>
              </Host>
            </View>
            <View style={styles.fabWrapper}>
              <Text style={styles.label}>#E8DEF8</Text>
              <Host matchContents>
                <FloatingActionButton
                  containerColor="#E8DEF8"
                  onClick={() => Alert.alert('Custom color FAB pressed')}>
                  <FloatingActionButton.Icon>
                    <Icon source={addIcon} />
                  </FloatingActionButton.Icon>
                </FloatingActionButton>
              </Host>
            </View>
            <View style={styles.fabWrapper}>
              <Text style={styles.label}>#FFD8E4</Text>
              <Host matchContents>
                <FloatingActionButton
                  containerColor="#FFD8E4"
                  onClick={() => Alert.alert('Custom color FAB pressed')}>
                  <FloatingActionButton.Icon>
                    <Icon source={addIcon} />
                  </FloatingActionButton.Icon>
                </FloatingActionButton>
              </Host>
            </View>
          </View>
        </View>

        {/* Extended FAB */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extended FAB</Text>
          <Text style={styles.description}>
            An ExtendedFloatingActionButton with icon and text slots. Toggle the expanded state
            below.
          </Text>
          <View style={styles.row}>
            <Host matchContents>
              <ExtendedFloatingActionButton
                expanded={extended}
                onClick={() => Alert.alert('Extended FAB pressed')}>
                <ExtendedFloatingActionButton.Icon>
                  <Icon source={editIcon} />
                </ExtendedFloatingActionButton.Icon>
                <ExtendedFloatingActionButton.Text>
                  <ComposeText>Edit</ComposeText>
                </ExtendedFloatingActionButton.Text>
              </ExtendedFloatingActionButton>
            </Host>
          </View>
          <View style={styles.row}>
            <Text style={styles.toggleButton} onPress={() => setExtended((v) => !v)}>
              {extended ? 'Collapse label' : 'Expand label'}
            </Text>
          </View>
        </View>

        {/* Extended FAB with custom color */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Extended FAB with custom color</Text>
          <View style={styles.column}>
            <View style={[styles.row, { marginBottom: 12 }]}>
              <Host matchContents>
                <ExtendedFloatingActionButton
                  containerColor="#E8DEF8"
                  onClick={() => Alert.alert('Extended FAB pressed')}>
                  <ExtendedFloatingActionButton.Icon>
                    <Icon source={addIcon} />
                  </ExtendedFloatingActionButton.Icon>
                  <ExtendedFloatingActionButton.Text>
                    <ComposeText>New item</ComposeText>
                  </ExtendedFloatingActionButton.Text>
                </ExtendedFloatingActionButton>
              </Host>
            </View>
            <View style={styles.row}>
              <Host matchContents>
                <ExtendedFloatingActionButton
                  containerColor="#FFD8E4"
                  onClick={() => Alert.alert('Extended FAB pressed')}>
                  <ExtendedFloatingActionButton.Icon>
                    <Icon source={editIcon} />
                  </ExtendedFloatingActionButton.Icon>
                  <ExtendedFloatingActionButton.Text>
                    <ComposeText>Edit</ComposeText>
                  </ExtendedFloatingActionButton.Text>
                </ExtendedFloatingActionButton>
              </Host>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating FAB — positioned over content like in a real app */}
      <View style={styles.floatingFab}>
        <Host matchContents>
          <FloatingActionButton onClick={() => Alert.alert('Floating FAB pressed')}>
            <FloatingActionButton.Icon>
              <Icon source={addIcon} />
            </FloatingActionButton.Icon>
          </FloatingActionButton>
        </Host>
      </View>
    </View>
  );
}

FloatingActionButtonScreen.navigationOptions = {
  title: 'FloatingActionButton',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  fabWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  toggleButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
    overflow: 'hidden',
  },
  floatingFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
});
