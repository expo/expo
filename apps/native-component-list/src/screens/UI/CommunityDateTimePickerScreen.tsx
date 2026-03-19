import DateTimePicker, {
  type DateTimePickerEvent,
  type DateTimePickerProps,
} from '@expo/ui/datetimepicker';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';

// Constants matching @react-native-community/datetimepicker
const IOS_MODES = ['date', 'time', 'datetime'] as const;
const ANDROID_MODES = ['date', 'time'] as const;
const IOS_DISPLAYS = ['default', 'spinner', 'compact', 'inline'] as const;
const ANDROID_DISPLAYS = ['default', 'spinner', 'calendar', 'clock'] as const;

type DisplayProp = Exclude<DateTimePickerProps['display'], undefined>;
type ModeProp = Exclude<DateTimePickerProps['mode'], undefined>;

const MODE_VALUES = Platform.select<readonly ModeProp[]>({
  ios: IOS_MODES,
  android: ANDROID_MODES,
  default: [],
});
const DISPLAY_VALUES = Platform.select<readonly DisplayProp[]>({
  ios: IOS_DISPLAYS,
  android: ANDROID_DISPLAYS,
  default: [],
});

const TIMEZONE_NAMES = [
  'America/New_York',
  'America/Vancouver',
  'Europe/London',
  'Europe/Istanbul',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Australia/Brisbane',
  'Australia/Sydney',
];

const Colors = {
  white: '#FFFFFF',
  black: '#000000',
  dark: '#333333',
  lighter: '#F5F5F5',
};

// TODO vonovak: replace with native Picker from @expo/ui
function SegmentedButtons<T extends string>({
  values,
  selected,
  onSelect,
}: {
  values: readonly T[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {values.map((v) => (
        <View key={v} style={[styles.segmentedItem, v === selected && styles.segmentedItemActive]}>
          <Button title={v} onPress={() => onSelect(v)} />
        </View>
      ))}
    </View>
  );
}

function ThemedText({ style, ...props }: React.ComponentProps<typeof Text>) {
  const isDark = useColorScheme() === 'dark';
  return <Text style={[{ color: isDark ? Colors.white : Colors.black }, style]} {...props} />;
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText style={styles.infoTitle}>{title}</ThemedText>
      <ThemedText style={styles.infoBody}>{body}</ThemedText>
    </View>
  );
}

// Sat, 13 Nov 2021 10:00:00 GMT
const SOURCE_DATE = new Date(1636765200 * 1000);

export default function CommunityDateTimePickerScreen() {
  const [date, setDate] = useState(SOURCE_DATE);
  const [mode, setMode] = useState<ModeProp>(MODE_VALUES[0]);
  const [show, setShow] = useState(false);
  const [accentColor, setAccentColor] = useState('');
  const [display, setDisplay] = useState<DisplayProp>(DISPLAY_VALUES[0]);
  const [minimumDate, setMinimumDate] = useState<Date | undefined>();
  const [maximumDate, setMaximumDate] = useState<Date | undefined>();
  const [disabled, setDisabled] = useState(false);
  const [is24Hour, setIs24Hour] = useState(false);
  const [timeZoneName, setTimeZoneName] = useState<string | undefined>();
  const [positiveLabel, setPositiveLabel] = useState('');
  const [negativeLabel, setNegativeLabel] = useState('');
  const [presentation, setPresentation] = useState<'inline' | 'dialog'>(
    Platform.OS === 'android' ? 'dialog' : 'inline'
  );

  const isDark = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDark ? Colors.dark : Colors.lighter,
  };

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android' && presentation === 'dialog') {
      setShow(false);
    }
    if (event.type === 'dismissed') {
      Alert.alert('picker was dismissed', undefined, [{ text: 'ok' }], { cancelable: true });
      return;
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const toggleMinMaxDate = () => {
    if (minimumDate || maximumDate) {
      setMinimumDate(undefined);
      setMaximumDate(undefined);
    } else {
      const start = new Date(SOURCE_DATE);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(SOURCE_DATE);
      end.setDate(end.getDate() + 1);
      end.setHours(23, 59, 59, 999);
      setMinimumDate(start);
      setMaximumDate(end);
    }
  };

  return (
    <View style={[styles.flex, backgroundStyle]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Info */}
        <View style={styles.header}>
          <ThemedText style={styles.headerText}>DateTimePicker Compat (Full)</ThemedText>
        </View>
        <Info title="Date:" body={date.toISOString()} />
        <Info title="Local:" body={date.toLocaleString()} />
        {timeZoneName && <Info title="TimeZone:" body={timeZoneName} />}
        {(minimumDate || maximumDate) && (
          <Info
            title="Min/Max:"
            body={`${minimumDate?.toLocaleDateString() ?? '–'} / ${maximumDate?.toLocaleDateString() ?? '–'}`}
          />
        )}

        {/* Mode */}
        <ThemedText style={styles.label}>mode:</ThemedText>
        <SegmentedButtons values={MODE_VALUES} selected={mode} onSelect={(v) => setMode(v)} />

        {/* Display */}
        <ThemedText style={styles.label}>display:</ThemedText>
        <SegmentedButtons
          values={DISPLAY_VALUES}
          selected={display}
          onSelect={(v) => setDisplay(v)}
        />

        {/* Presentation (Android) */}
        {Platform.OS === 'android' && (
          <>
            <ThemedText style={styles.label}>presentation:</ThemedText>
            <SegmentedButtons
              values={['inline', 'dialog']}
              selected={presentation}
              onSelect={(v) => setPresentation(v)}
            />
          </>
        )}

        {/* accentColor */}
        <View style={styles.row}>
          <ThemedText style={styles.label}>accentColor:</ThemedText>
          <TextInput
            style={[styles.textInput, { color: isDark ? Colors.white : Colors.black }]}
            value={accentColor}
            onChangeText={(t) => setAccentColor(t.toLowerCase())}
            placeholder="#E040FB"
            placeholderTextColor={isDark ? '#999' : '#666'}
          />
        </View>

        {/* disabled (iOS) */}
        {Platform.OS === 'ios' && (
          <View style={styles.row}>
            <ThemedText style={styles.label}>disabled:</ThemedText>
            <Switch value={disabled} onValueChange={setDisabled} />
          </View>
        )}

        {/* is24Hour (Android) */}
        {Platform.OS === 'android' && (
          <View style={styles.row}>
            <ThemedText style={styles.label}>is24Hour:</ThemedText>
            <Switch value={is24Hour} onValueChange={setIs24Hour} />
          </View>
        )}

        {/* positiveButton / negativeButton labels (Android dialog) */}
        {Platform.OS === 'android' && (
          <>
            <View style={styles.row}>
              <ThemedText style={styles.label}>positiveButton label:</ThemedText>
              <TextInput
                style={[styles.textInput, { color: isDark ? Colors.white : Colors.black }]}
                value={positiveLabel}
                onChangeText={setPositiveLabel}
                placeholder="OK"
                placeholderTextColor={isDark ? '#999' : '#666'}
              />
            </View>
            <View style={styles.row}>
              <ThemedText style={styles.label}>negativeButton label:</ThemedText>
              <TextInput
                style={[styles.textInput, { color: isDark ? Colors.white : Colors.black }]}
                value={negativeLabel}
                onChangeText={setNegativeLabel}
                placeholder="Cancel"
                placeholderTextColor={isDark ? '#999' : '#666'}
              />
            </View>
          </>
        )}

        {/* timeZoneName (iOS) */}
        {Platform.OS === 'ios' && (
          <>
            <ThemedText style={styles.label}>timeZoneName:</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tzScroll}>
              <View style={styles.segmented}>
                <View style={[styles.segmentedItem, !timeZoneName && styles.segmentedItemActive]}>
                  <Button title="none" onPress={() => setTimeZoneName(undefined)} />
                </View>
                {TIMEZONE_NAMES.map((tz) => (
                  <View
                    key={tz}
                    style={[
                      styles.segmentedItem,
                      tz === timeZoneName && styles.segmentedItemActive,
                    ]}>
                    <Button title={tz.split('/')[1]} onPress={() => setTimeZoneName(tz)} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* Min/Max toggle */}
        <View style={styles.buttonRow}>
          <Button
            title={minimumDate ? 'Clear min/max' : 'Set min/max (source day ± 1)'}
            onPress={toggleMinMaxDate}
          />
        </View>

        {/* Show / Hide */}
        <View style={styles.buttonRow}>
          <Button title="Show picker" onPress={() => setShow(true)} />
          <Button title="Hide picker" onPress={() => setShow(false)} />
        </View>

        {/* Show and dismiss after 3s (Android dialog test) */}
        {Platform.OS === 'android' && (
          <View style={styles.buttonRow}>
            <Button
              title="Show & dismiss after 3s"
              onPress={() => {
                setShow(true);
                setTimeout(() => setShow(false), 3000);
              }}
            />
          </View>
        )}

        {/* The picker */}
        {show && (
          <View style={styles.pickerContainer}>
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={mode}
              display={display}
              onChange={onChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              accentColor={accentColor || undefined}
              disabled={disabled}
              locale="en-US"
              timeZoneName={timeZoneName}
              is24Hour={is24Hour}
              presentation={presentation}
              positiveButton={positiveLabel ? { label: positiveLabel } : undefined}
              negativeButton={negativeLabel ? { label: negativeLabel } : undefined}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

CommunityDateTimePickerScreen.navigationOptions = {
  title: 'Community DateTimePicker',
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 12, paddingBottom: 80 },
  header: { alignItems: 'center', marginBottom: 12 },
  headerText: { fontSize: 18, fontWeight: 'bold' },
  label: { marginTop: 10, marginBottom: 4, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  infoRow: { flexDirection: 'row', paddingVertical: 2 },
  infoTitle: { flex: 1, fontWeight: '600' },
  infoBody: { flex: 2 },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  segmentedItem: { borderRadius: 6, overflow: 'hidden' },
  segmentedItemActive: { backgroundColor: '#ddd' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  tzScroll: { marginBottom: 6 },
  pickerContainer: { marginTop: 12 },
});
