import React from 'react';
import { View } from 'react-native';

// Test tsconfig absolute imports
import 'absolute-import.js';
// Test tsconfig aliases
import '@/aliased';

require('./assets/icon.png');
require('./assets/font.ttf');

export default () => <View />;
