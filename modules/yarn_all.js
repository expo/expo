const proc = require('child_process');

const dirs = [
  'NCL',
  'TestSuite',
  'camersja',
  'expo-camera',
  'expo-contacts',
  'expo-core',
  'expo-face-detector',
  'expo-face-detector-interface',
  'expo-file-system',
  'expo-file-system-interface',
  'expo-permissions',
  'expo-permissions-interface',
  'expo-react-native-adapter',
  'expo-sensors',
  'expo-sensors-interface',
];

dirs.forEach((dir) => proc.spawnSync('yarn', { cwd: dir, stdio: 'inherit' }));
