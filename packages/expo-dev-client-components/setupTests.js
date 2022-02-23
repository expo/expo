jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  addEventListener: jest.fn(),
  announceForAccessibility: jest.fn(),
  fetch: jest.fn(),
  isBoldTextEnabled: jest.fn().mockResolvedValue(false),
  isGrayscaleEnabled: jest.fn().mockResolvedValue(false),
  isInvertColorsEnabled: jest.fn().mockResolvedValue(false),
  isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
  isReduceTransparencyEnabled: jest.fn().mockResolvedValue(false),
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  removeEventListener: jest.fn(),
  setAccessibilityFocus: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/Appearance', () => {
  return {
    addChangeListener: jest.fn(),
    removeChangeListener: jest.fn(),
    getColorScheme: jest.fn(() => 'light'),
  };
});
