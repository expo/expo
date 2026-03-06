import { FloatingActionButton, Host } from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

const addIcon = require('../../../assets/icons/ui/add.xml');
const editIcon = require('../../../assets/icons/ui/edit.xml');

export default function FloatingActionButtonScreen() {
  const [extended, setExtended] = useState(true);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>FloatingActionButton</Text>
      <Text style={styles.subtitle}>Material Design 3 Floating Action Buttons</Text>

      {/* Standard FAB sizes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Standard FAB sizes</Text>
        <View style={styles.row}>
          <View style={styles.fabWrapper}>
            <Text style={styles.label}>small</Text>
            <Host matchContents>
              <FloatingActionButton
                icon={addIcon}
                size="small"
                onPress={() => Alert.alert('Small FAB pressed')}
              />
            </Host>
          </View>
          <View style={styles.fabWrapper}>
            <Text style={styles.label}>medium</Text>
            <Host matchContents>
              <FloatingActionButton
                icon={addIcon}
                size="medium"
                onPress={() => Alert.alert('Medium FAB pressed')}
              />
            </Host>
          </View>
          <View style={styles.fabWrapper}>
            <Text style={styles.label}>large</Text>
            <Host matchContents>
              <FloatingActionButton
                icon={addIcon}
                size="large"
                onPress={() => Alert.alert('Large FAB pressed')}
              />
            </Host>
          </View>
        </View>
      </View>

      {/* Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Variants</Text>
        <View style={styles.row}>
          {(['surface', 'primary', 'secondary', 'tertiary'] as const).map((variant) => (
            <View key={variant} style={styles.fabWrapper}>
              <Text style={styles.label}>{variant}</Text>
              <Host matchContents>
                <FloatingActionButton
                  icon={addIcon}
                  variant={variant}
                  onPress={() => Alert.alert(`${variant} FAB pressed`)}
                />
              </Host>
            </View>
          ))}
        </View>
      </View>

      {/* Extended FAB */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extended FAB</Text>
        <Text style={styles.description}>
          When a label is provided, an ExtendedFloatingActionButton is rendered. Toggle the
          expanded state below.
        </Text>
        <View style={styles.row}>
          <Host matchContents>
            <FloatingActionButton
              icon={editIcon}
              label="Edit"
              expanded={extended}
              variant="primary"
              onPress={() => Alert.alert('Extended FAB pressed')}
            />
          </Host>
        </View>
        <View style={styles.row}>
          <Text
            style={styles.toggleButton}
            onPress={() => setExtended((v) => !v)}>
            {extended ? 'Collapse label' : 'Expand label'}
          </Text>
        </View>
      </View>

      {/* Extended variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Extended FAB variants</Text>
        <View style={styles.column}>
          {(['surface', 'primary', 'secondary', 'tertiary'] as const).map((variant) => (
            <View key={variant} style={[styles.row, { marginBottom: 12 }]}>
              <Host matchContents>
                <FloatingActionButton
                  icon={addIcon}
                  label={variant.charAt(0).toUpperCase() + variant.slice(1)}
                  variant={variant}
                  onPress={() => Alert.alert(`${variant} Extended FAB pressed`)}
                />
              </Host>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

FloatingActionButtonScreen.navigationOptions = {
  title: 'FloatingActionButton',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
});
