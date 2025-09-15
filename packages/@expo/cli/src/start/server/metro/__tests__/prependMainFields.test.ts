import { prependMainFields } from '../prependMainFields';

// NOTE: As defined in `@expo/metro-config`
const DEFAULT_FIELDS = ['react-native', 'browser', 'main'];

it('it constructs default fields', () => {
  let mainFields: readonly string[];

  // CommonJS + client-side
  mainFields = prependMainFields(['react-native'], {
    enableModuleField: false,
    isServerEnv: false,
    userMainFields: DEFAULT_FIELDS,
  });
  expect(mainFields).toEqual(['react-native', 'browser', 'main']);
  // ESM + client-side
  mainFields = prependMainFields(['react-native'], {
    enableModuleField: true,
    isServerEnv: false,
    userMainFields: DEFAULT_FIELDS,
  });
  expect(mainFields).toEqual(['react-native', 'browser', 'module', 'main']);
  // CommonJS + server-side
  mainFields = prependMainFields(['react-native'], {
    enableModuleField: false,
    isServerEnv: true,
    userMainFields: DEFAULT_FIELDS,
  });
  expect(mainFields).toEqual(['react-native', 'main', 'module']);
  // ESM + server-side
  mainFields = prependMainFields(['react-native'], {
    enableModuleField: true,
    isServerEnv: true,
    userMainFields: DEFAULT_FIELDS,
  });
  expect(mainFields).toEqual(['react-native', 'module', 'main']);
});

it('it constructs web fields', () => {
  let mainFields: readonly string[];

  // CommonJS + client-side
  mainFields = prependMainFields(['browser'], {
    enableModuleField: false,
    isServerEnv: false,
    userMainFields: DEFAULT_FIELDS,
  });
  expect(mainFields).toEqual(['browser', 'main']);
  // ESM + client-side
  mainFields = prependMainFields(['browser'], {
    enableModuleField: true,
    isServerEnv: false,
    userMainFields: DEFAULT_FIELDS,
  });
  expect(mainFields).toEqual(['browser', 'module', 'main']);
  // CommonJS + server-side
  mainFields = prependMainFields(['browser'], {
    enableModuleField: false,
    isServerEnv: true,
    userMainFields: DEFAULT_FIELDS,
  });
  expect(mainFields).toEqual(['main', 'module']);
  // ESM + server-side
  mainFields = prependMainFields(['browser'], {
    enableModuleField: true,
    isServerEnv: true,
    userMainFields: DEFAULT_FIELDS,
  });
  expect(mainFields).toEqual(['module', 'main']);
});

it('it constructs customized fields', () => {
  let mainFields: readonly string[];

  // CommonJS + client-side
  mainFields = prependMainFields(['react-native'], {
    enableModuleField: false,
    isServerEnv: false,
    userMainFields: ['custom'],
  });
  expect(mainFields).toEqual(['custom', 'react-native', 'main']);
  // ESM + client-side
  mainFields = prependMainFields(['react-native'], {
    enableModuleField: true,
    isServerEnv: false,
    userMainFields: ['custom'],
  });
  expect(mainFields).toEqual(['custom', 'react-native', 'module', 'main']);
  // CommonJS + server-side
  mainFields = prependMainFields(['react-native'], {
    enableModuleField: false,
    isServerEnv: true,
    userMainFields: ['custom'],
  });
  expect(mainFields).toEqual(['custom', 'react-native', 'main', 'module']);
  // ESM + server-side
  mainFields = prependMainFields(['react-native'], {
    enableModuleField: true,
    isServerEnv: true,
    userMainFields: ['custom'],
  });
  expect(mainFields).toEqual(['custom', 'react-native', 'module', 'main']);
});
