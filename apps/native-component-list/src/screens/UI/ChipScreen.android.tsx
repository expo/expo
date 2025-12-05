import { Chip as JetpackChip, ChipTextStyle, Host, Slider } from '@expo/ui/jetpack-compose';
import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet, Pressable } from 'react-native';

function Chip(props: React.ComponentProps<typeof JetpackChip>) {
  return (
    <Host>
      <JetpackChip {...props} />
    </Host>
  );
}

export default function ChipScreen() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['All']);
  const [inputChips, setInputChips] = useState(['Work', 'Travel', 'News']);
  const [iconSize, setIconSize] = useState(18);
  const [textStyle, setTextStyle] = useState<ChipTextStyle>('labelSmall');

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const handleInputDismiss = (chipLabel: string) => {
    setInputChips((prev) => prev.filter((chip) => chip !== chipLabel));
    Alert.alert('Chip Removed', `Removed "${chipLabel}" from input`);
  };

  const addInputChip = () => {
    const suggestions = [
      'Design',
      'Development',
      'Marketing',
      'Sales',
      'Support',
      'Personal',
      'Health',
    ];
    const available = suggestions.filter((s) => !inputChips.includes(s));
    if (available.length > 0) {
      const newChip = available[Math.floor(Math.random() * available.length)];
      setInputChips((prev) => [...prev, newChip]);
    }
  };

  const textStyleOptions: ChipTextStyle[] = [
    'labelSmall',
    'labelMedium',
    'labelLarge',
    'bodySmall',
    'bodyMedium',
    'bodyLarge',
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Material 3 Chips</Text>
      <Text style={styles.subtitle}>
        Four chip types: Assist (actions), Filter (selections), Input (removable tags), Suggestion
        (recommendations).
      </Text>
      {/* Assist Chips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Assist Chips</Text>
        <Text style={styles.sectionDescription}>Help users complete actions and primary tasks</Text>
        <View style={styles.exampleGrid}>
          <Chip
            variant="assist"
            label="Book"
            leadingIcon="filled.Add"
            iconSize={iconSize}
            textStyle={textStyle}
            onPress={() => Alert.alert('Assist', 'Opening flight booking...')}
          />
          <Chip
            variant="assist"
            label="Calendar"
            leadingIcon="filled.DateRange"
            trailingIcon="filled.ArrowForward"
            iconSize={iconSize}
            textStyle={textStyle}
            onPress={() => Alert.alert('Assist', 'Adding to calendar...')}
          />
          <Chip
            variant="assist"
            label="Share"
            leadingIcon="filled.Share"
            iconSize={iconSize}
            textStyle={textStyle}
            onPress={() => Alert.alert('Assist', 'Sharing location...')}
          />
          <Chip
            variant="assist"
            label="Call"
            leadingIcon="filled.Call"
            iconSize={iconSize}
            textStyle={textStyle}
            onPress={() => Alert.alert('Assist', 'Calling support...')}
          />
          <Chip
            variant="assist"
            label="Disabled"
            leadingIcon="filled.Lock"
            iconSize={iconSize}
            textStyle={textStyle}
            enabled={false}
            onPress={() => Alert.alert('This should not appear')}
          />
        </View>
      </View>
      {/* Filter Chips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Filter Chips</Text>
        <Text style={styles.sectionDescription}>
          Help users refine and filter content (toggle selection)
        </Text>
        <View style={styles.exampleGrid}>
          <Chip
            variant="filter"
            label="All"
            iconSize={iconSize}
            textStyle={textStyle}
            selected={selectedFilters.includes('All')}
            onPress={() => handleFilterToggle('All')}
          />
          <Chip
            variant="filter"
            label="Images"
            leadingIcon="filled.Star"
            trailingIcon="filled.Photo"
            iconSize={iconSize}
            textStyle={textStyle}
            selected={selectedFilters.includes('Images')}
            onPress={() => handleFilterToggle('Images')}
          />
          <Chip
            variant="filter"
            label="Docs"
            leadingIcon="filled.Create"
            iconSize={iconSize}
            textStyle={textStyle}
            selected={selectedFilters.includes('Docs')}
            onPress={() => handleFilterToggle('Docs')}
          />
          <Chip
            variant="filter"
            label="Videos"
            leadingIcon="filled.Star"
            trailingIcon="filled.PlayArrow"
            iconSize={iconSize}
            textStyle={textStyle}
            selected={selectedFilters.includes('Videos')}
            onPress={() => handleFilterToggle('Videos')}
          />
          <Chip
            variant="filter"
            label="Disabled"
            leadingIcon="filled.Lock"
            iconSize={iconSize}
            textStyle={textStyle}
            selected={false}
            enabled={false}
            onPress={() => handleFilterToggle('Disabled')}
          />
        </View>
      </View>
      {/* Input Chips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏷️ Input Chips</Text>
        <Text style={styles.sectionDescription}>Represent user input that can be dismissed</Text>
        <View style={styles.inputChipContainer}>
          {inputChips.map((chipLabel) => (
            <Chip
              key={chipLabel}
              variant="input"
              label={chipLabel}
              iconSize={iconSize}
              textStyle={textStyle}
              onDismiss={() => handleInputDismiss(chipLabel)}
            />
          ))}
          <Pressable style={styles.addChipButton} onPress={addInputChip}>
            <Text style={styles.addChipText}>+ Add Tag</Text>
          </Pressable>
        </View>
      </View>
      {/* Suggestion Chips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Suggestion Chips</Text>
        <Text style={styles.sectionDescription}>
          Offer contextual suggestions and recommendations
        </Text>
        <View style={styles.exampleGrid}>
          <Chip
            variant="suggestion"
            label="Dark Mode"
            textStyle={textStyle}
            onPress={() => Alert.alert('Suggestion', 'Applying dark mode...')}
          />
          <Chip
            variant="suggestion"
            label="Nearby"
            leadingIcon="filled.LocationOn"
            iconSize={iconSize}
            textStyle={textStyle}
            onPress={() => Alert.alert('Suggestion', 'Searching nearby...')}
          />
          <Chip
            variant="suggestion"
            label="Photos"
            leadingIcon="filled.Star"
            iconSize={iconSize}
            textStyle={textStyle}
            onPress={() => Alert.alert('Suggestion', 'Adding photos...')}
          />
          <Chip
            variant="suggestion"
            label="Weather"
            leadingIcon="filled.Star"
            iconSize={iconSize}
            textStyle={textStyle}
            onPress={() => Alert.alert('Suggestion', 'Showing weather...')}
          />
        </View>
      </View>
      {/* Icon Size Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎛️ Icon Size Control</Text>
        <Text style={styles.sectionDescription}>
          Adjust icon size for all chips: {Math.round(iconSize)}dp
        </Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>10dp</Text>
          <Slider value={iconSize} min={10} max={30} onValueChange={setIconSize} />
          <Text style={styles.sliderLabel}>30dp</Text>
        </View>
      </View>
      {/* Text Style Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Text Style Control</Text>
        <Text style={styles.sectionDescription}>Current text style: {textStyle}</Text>
        <View style={styles.buttonRow}>
          {textStyleOptions.map((style) => (
            <Pressable
              key={style}
              style={[styles.styleButton, textStyle === style && styles.styleButtonSelected]}
              onPress={() => setTextStyle(style)}>
              <Text
                style={[
                  styles.styleButtonText,
                  textStyle === style && styles.styleButtonTextSelected,
                ]}>
                {style}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
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
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  exampleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  inputChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 10,
  },
  addChipButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    marginTop: 4,
  },
  addChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#495057',
    fontFamily: 'monospace',
  },
  shortChipWithIcon: {
    width: 80,
    height: 32,
  },
  mediumChipWithIcon: {
    width: 110,
    height: 32,
  },
  largeChipWithIcon: {
    width: 130,
    height: 32,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
  },

  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  styleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  styleButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  styleButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  styleButtonTextSelected: {
    color: 'white',
  },
});

ChipScreen.navigationOptions = {
  title: 'Chip',
};
