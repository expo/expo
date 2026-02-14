import { Button, BottomSheet, Host, Switch } from '@expo/ui/jetpack-compose';
import type { PresentationDetent } from '@expo/ui/jetpack-compose';
import * as React from 'react';
import { Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';

function formatDetent(detent: PresentationDetent): string {
  if (typeof detent === 'string') return detent;
  if ('fraction' in detent) return `${detent.fraction * 100}%`;
  return `${detent.height}dp`;
}

export default function BottomSheetScreen() {
  const [showBasic, setShowBasic] = React.useState(false);
  const [showFitsContent, setShowFitsContent] = React.useState(false);

  const [showDetents, setShowDetents] = React.useState(false);
  const [useMedium, setUseMedium] = React.useState(true);
  const [useLarge, setUseLarge] = React.useState(false);

  const [showFraction, setShowFraction] = React.useState(false);
  const [fractionText, setFractionText] = React.useState('40');
  const fractionValue = Math.max(1, Math.min(100, parseInt(fractionText, 10) || 40)) / 100;

  const [showHeight, setShowHeight] = React.useState(false);
  const [heightText, setHeightText] = React.useState('200');
  const heightValue = Math.max(50, parseInt(heightText, 10) || 200);

  const [showSelection, setShowSelection] = React.useState(false);
  const [selectedDetent, setSelectedDetent] = React.useState<PresentationDetent>('medium');

  const detents: PresentationDetent[] = (() => {
    const d: PresentationDetent[] = [];
    if (useMedium) d.push('medium');
    if (useLarge) d.push('large');
    return d.length > 0 ? d : ['medium'];
  })();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Basic */}
      <Text style={styles.sectionTitle}>Basic</Text>
      <Host matchContents>
        <Button onPress={() => setShowBasic(true)}>Open Basic Sheet</Button>
        <BottomSheet isOpened={showBasic} onIsOpenedChange={setShowBasic}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Basic Bottom Sheet</Text>
            <Text style={styles.sheetSubtitle}>Swipe down or tap outside to dismiss</Text>
          </View>
        </BottomSheet>
      </Host>

      {/* Fits Content */}
      <Text style={styles.sectionTitle}>Fits Content</Text>
      <Text style={styles.detentInfo}>Sheet automatically sizes to fit its content</Text>
      <Host matchContents>
        <Button onPress={() => setShowFitsContent(true)}>Open Fits Content Sheet</Button>
        <BottomSheet
          isOpened={showFitsContent}
          onIsOpenedChange={setShowFitsContent}
          fitToContents>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Fits Content</Text>
            <Text style={styles.sheetSubtitle}>
              This sheet sizes to fit its content automatically.
            </Text>
            <Text style={styles.sheetSubtitle}>It only takes as much space as needed.</Text>
            <Pressable
              style={styles.sheetButton}
              onPress={() => setShowFitsContent(false)}>
              <Text style={styles.sheetButtonText}>Close</Text>
            </Pressable>
          </View>
        </BottomSheet>
      </Host>

      {/* Detents: medium / large */}
      <Text style={styles.sectionTitle}>Detents</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Medium</Text>
        <Host style={styles.switchHost}>
          <Switch value={useMedium} onValueChange={setUseMedium} />
        </Host>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Large</Text>
        <Host style={styles.switchHost}>
          <Switch value={useLarge} onValueChange={setUseLarge} />
        </Host>
      </View>
      <Text style={styles.detentInfo}>Active: {detents.map(formatDetent).join(', ')}</Text>
      <Host matchContents>
        <Button onPress={() => setShowDetents(true)}>Open Detents Sheet</Button>
        <BottomSheet
          isOpened={showDetents}
          onIsOpenedChange={setShowDetents}
          detents={detents}
          selectedDetent={detents[0]}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Detents Sheet</Text>
            <Text style={styles.sheetSubtitle}>Detents: {detents.map(formatDetent).join(', ')}</Text>
          </View>
        </BottomSheet>
      </Host>

      {/* Custom Fraction */}
      <Text style={styles.sectionTitle}>Custom Fraction</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Percent (1–100):</Text>
        <TextInput
          style={styles.input}
          value={fractionText}
          onChangeText={setFractionText}
          keyboardType="number-pad"
          maxLength={3}
        />
        <Text style={styles.label}>%</Text>
      </View>
      <Text style={styles.detentInfo}>Will open at {Math.round(fractionValue * 100)}% of screen</Text>
      <Host matchContents>
        <Button onPress={() => setShowFraction(true)}>
          Open {Math.round(fractionValue * 100)}% Sheet
        </Button>
        <BottomSheet
          isOpened={showFraction}
          onIsOpenedChange={setShowFraction}
          detents={[{ fraction: fractionValue }]}
          selectedDetent={{ fraction: fractionValue }}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{Math.round(fractionValue * 100)}% Height Sheet</Text>
            <Text style={styles.sheetSubtitle}>fraction: {fractionValue}</Text>
          </View>
        </BottomSheet>
      </Host>

      {/* Custom Height */}
      <Text style={styles.sectionTitle}>Custom Height</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Height (dp):</Text>
        <TextInput
          style={styles.input}
          value={heightText}
          onChangeText={setHeightText}
          keyboardType="number-pad"
          maxLength={4}
        />
        <Text style={styles.label}>dp</Text>
      </View>
      <Text style={styles.detentInfo}>Will open at {heightValue}dp</Text>
      <Host matchContents>
        <Button onPress={() => setShowHeight(true)}>Open {heightValue}dp Sheet</Button>
        <BottomSheet
          isOpened={showHeight}
          onIsOpenedChange={setShowHeight}
          detents={[{ height: heightValue }]}
          selectedDetent={{ height: heightValue }}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>{heightValue}dp Height Sheet</Text>
            <Text style={styles.sheetSubtitle}>height: {heightValue}</Text>
          </View>
        </BottomSheet>
      </Host>

      {/* Selection tracking */}
      <Text style={styles.sectionTitle}>Selection Tracking</Text>
      <Text style={styles.detentInfo}>Current: {formatDetent(selectedDetent)}</Text>
      <Host matchContents>
        <Button onPress={() => setShowSelection(true)}>Open Selection Sheet</Button>
        <BottomSheet
          isOpened={showSelection}
          onIsOpenedChange={setShowSelection}
          detents={['medium', 'large']}
          selectedDetent={selectedDetent}
          onSelectedDetentChange={setSelectedDetent}>
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Selection Tracking</Text>
            <Text style={styles.sheetSubtitle}>Current: {formatDetent(selectedDetent)}</Text>
            <Text style={styles.sheetSubtitle}>Drag to change between medium and large</Text>
            <View style={styles.buttonRow}>
              <Pressable style={styles.sheetButton} onPress={() => setSelectedDetent('medium')}>
                <Text style={styles.sheetButtonText}>Medium</Text>
              </Pressable>
              <Pressable style={styles.sheetButton} onPress={() => setSelectedDetent('large')}>
                <Text style={styles.sheetButtonText}>Large</Text>
              </Pressable>
            </View>
          </View>
        </BottomSheet>
      </Host>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  label: {
    fontSize: 14,
  },
  switchHost: {
    width: 60,
    height: 32,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    textAlign: 'center',
  },
  detentInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  sheetContent: {
    padding: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sheetSubtitle: {
    color: '#666',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  sheetButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  sheetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

BottomSheetScreen.navigationOptions = {
  title: 'BottomSheet',
};
