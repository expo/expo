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

  // workaround to be compatible with modern `Accessibility` in RN 0.66 which has ESM export
  // Use `return { default: MockAccessibility };` when we drop support for SDK 44
  MockA11y.default = MockA11y;

  return MockA11y;
});

jest.mock('react-native/Libraries/Utilities/Appearance', () => {
  const MockAppearance = {
    addChangeListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeChangeListener: jest.fn(),
    getColorScheme: jest.fn(() => 'light'),
  };

  // workaround to be compatible with modern `Appearance` in RN 0.66 which has ESM export
  // Use `return { default: MockAppearance };` when we drop support for SDK 44
  MockAppearance.default = MockAppearance;

  return MockAppearance;
});
