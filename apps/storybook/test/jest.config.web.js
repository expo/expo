module.exports = {
  preset: 'react-native-web',
  moduleFileExtensions: [
    'web.js',
    'js',
    'json',
    'web.jsx',
    'jsx',
    'web.ts',
    'ts',
    'web.tsx',
    'tsx',
    'node',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|md|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>test/enzyme.config.js'],
  transformIgnorePatterns: [],
  // snapshotSerializers: ['react-native-web/jest/serializer'],
  rootDir: '..',
};
