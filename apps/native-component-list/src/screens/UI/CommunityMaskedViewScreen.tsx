import { MaskedView } from '@expo/ui/community/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CommunityMaskedViewScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Section title="Text mask with colored stripes">
        <MaskedView
          style={{ width: 320, height: 80, flexDirection: 'row' }}
          maskElement={
            <View style={styles.center}>
              <Text style={styles.boldLg}>Basic Mask</Text>
            </View>
          }>
          <View style={[styles.stripe, { backgroundColor: '#3D5A80' }]} />
          <View style={[styles.stripe, { backgroundColor: '#DAA520' }]} />
          <View style={[styles.stripe, { backgroundColor: '#E07A5F' }]} />
          <View style={[styles.stripe, { backgroundColor: '#D5D5D5' }]} />
        </MaskedView>
      </Section>

      <Section title="Gradient text via expo-linear-gradient">
        <MaskedView
          style={{ width: 300, height: 80 }}
          maskElement={
            <View style={styles.center}>
              <Text style={styles.boldXl}>EXPO</Text>
            </View>
          }>
          <LinearGradient
            colors={['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      </Section>

      <Section title="Gradient text via experimental_backgroundImage">
        <MaskedView
          style={{ width: 300, height: 80 }}
          maskElement={
            <View style={styles.center}>
              <Text style={styles.boldXl}>EXPO</Text>
            </View>
          }>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                experimental_backgroundImage:
                  'linear-gradient(135deg, #FF3B30, #FF9500, #FFCC00, #34C759, #007AFF, #AF52DE)',
              },
            ]}
          />
        </MaskedView>
      </Section>

      <Section title="Circle mask over red/blue split">
        <MaskedView
          style={{ width: 200, height: 200, flexDirection: 'row' }}
          maskElement={
            <View style={styles.center}>
              <View style={styles.circleMask} />
            </View>
          }>
          <View style={{ width: 100, height: 200, backgroundColor: '#FF3B30' }} />
          <View style={{ width: 100, height: 200, backgroundColor: '#007AFF' }} />
        </MaskedView>
      </Section>

      <Section title="Rounded rectangle mask with gradient">
        <MaskedView
          style={{ width: 260, height: 120 }}
          maskElement={
            <View style={styles.center}>
              <View style={styles.roundedMask} />
            </View>
          }>
          <LinearGradient
            colors={['#FF2D55', '#AF52DE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      </Section>

      <Section title="Stacked text mask">
        <MaskedView
          style={{ width: 280, height: 140 }}
          maskElement={
            <View style={styles.center}>
              <Text style={styles.boldLg}>HELLO</Text>
              <Text style={styles.boldLg}>WORLD</Text>
            </View>
          }>
          <LinearGradient
            colors={['#FF9500', '#FF3B30']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      </Section>

      <Section title="Gradient alpha fade (horizontal)">
        <MaskedView
          style={{ width: 300, height: 80, flexDirection: 'row' }}
          maskElement={
            <LinearGradient
              colors={['#000000', '#00000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          }>
          <View style={[styles.stripe60, { backgroundColor: '#3D5A80' }]} />
          <View style={[styles.stripe60, { backgroundColor: '#DAA520' }]} />
          <View style={[styles.stripe60, { backgroundColor: '#E07A5F' }]} />
          <View style={[styles.stripe60, { backgroundColor: '#34C759' }]} />
          <View style={[styles.stripe60, { backgroundColor: '#007AFF' }]} />
        </MaskedView>
      </Section>

      <Section title="Gradient alpha fade (vertical)">
        <MaskedView
          style={{ width: 200, height: 200 }}
          maskElement={
            <LinearGradient
              colors={['#000000', '#000000', '#00000000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          }>
          <LinearGradient
            colors={['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 24,
    alignItems: 'center',
  },
  section: {
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#636366',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBody: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderStyle: 'dashed',
    padding: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripe: {
    width: 80,
    height: 80,
  },
  stripe60: {
    width: 60,
    height: 80,
  },
  boldLg: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  boldXl: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  circleMask: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#000000',
  },
  roundedMask: {
    width: 240,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#000000',
  },
});

CommunityMaskedViewScreen.navigationOptions = {
  title: 'MaskedView',
};
