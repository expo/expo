// A route whose only job is to import the platform-resolved pair beside it, so the break in
// `platform-note.android.broken.ts` is in the entry bundle. Nothing navigates here.
import { Text, View } from 'react-native';

import { PLATFORM_NOTE } from '../lib/platform-note';

export default function ProbeScreen() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text testID="platform-note">{PLATFORM_NOTE}</Text>
    </View>
  );
}
