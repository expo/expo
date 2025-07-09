jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => {
  const MockA11y = {
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
  };
  return {
    __esModule: true,
    default: MockA11y,
  };
});

jest.mock('react-native/Libraries/Utilities/Appearance', () => {
  const MockAppearance = {
    addChangeListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeChangeListener: jest.fn(),
    getColorScheme: jest.fn(() => 'light'),
  };
  return {
    __esModule: true,
    default: MockAppearance,
    ...MockAppearance,
  };
});
