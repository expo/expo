import { lightTheme, shadows, spacing } from '@expo/styleguide-native';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: lightTheme.background.default,
  },
  storyRow: {},
  storyButtonRow: {
    padding: spacing[4],
  },
  storyTitle: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    marginTop: spacing[4],
    marginBottom: spacing[1],
    fontSize: 20,
    fontWeight: '700',
  },
  storyButton: {
    borderRadius: 4,
    paddingVertical: spacing[4],
    marginVertical: spacing[2],
    backgroundColor: lightTheme.button.primary.background,
    ...shadows.button,
  },
  storyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: lightTheme.button.primary.foreground,
    textAlign: 'center',
  },
  refreshButton: {
    position: 'absolute',
    padding: spacing[3],
    bottom: spacing[6],
    left: 0,
    right: 0,
  },
  refreshLoader: {
    position: 'absolute',
    right: spacing[4],
    bottom: 0,
    top: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: spacing[24] + spacing[6],
  },
  seeSelectionButtonContainer: {
    position: 'absolute',
    bottom: spacing[24],
    left: 0,
    right: 0,
    paddingHorizontal: spacing[6],
  },
  sectionHeaderContainer: {
    paddingTop: spacing[6],
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[3],
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: '700',
    color: lightTheme.text.default,
  },
});
