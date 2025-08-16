import { Link } from 'expo-router';
import { View, StyleSheet } from 'react-native';

export default function Page() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <View style={{ alignItems: 'center' }}>
          <Link testID="open-modal" href="/modal" style={styles.button}>
            Sheet (0.5, 1)
          </Link>

          <Link testID="open-modal-multi" href="/modal-multi" style={styles.button}>
            Sheet (0.25, 0.5, 0.75, 0.98)
          </Link>

          <Link testID="open-sheet-fit" href="/sheet-fit" style={styles.button}>
            Sheet (Fit To Contents)
          </Link>

          <Link testID="open-sheet-radius" href="/sheet-radius" style={styles.button}>
            Sheet (border radius 40)
          </Link>

          <Link testID="open-sheet-bg" href="/sheet-bg" style={styles.button}>
            Sheet (background color red)
          </Link>
        </View>

        <View style={{ marginLeft: 16, alignItems: 'center' }}>
          <Link testID="open-modal-regular" href="/modal-regular" style={styles.button}>
            Modal (Regular)
          </Link>
          <Link testID="open-modal-bg" href="/modal-regular-bg" style={styles.button}>
            Modal (Regular with red background)
          </Link>
          <Link testID="open-modal-scroll" href="/modal-scroll" style={styles.button}>
            Modal (Full Screen)
          </Link>

          <Link testID="open-modal-fit" href="/modal-fit" style={styles.button}>
            Modal (fit content)
          </Link>

          <Link testID="open-modal-transparent" href="/modal-transparent" style={styles.button}>
            Modal (transparent)
          </Link>
          <Link testID="open-modal-multi" href="/nested/page" style={styles.button}>
            Page
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 180,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    backgroundColor: '#333',
    color: 'white',
    fontSize: 14,
  },
});
