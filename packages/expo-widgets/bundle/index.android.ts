import { Box } from '../../expo-ui/src/jetpack-compose/Box';
import {
  Button,
  ElevatedButton,
  FilledTonalButton,
  OutlinedButton,
  TextButton,
} from '../../expo-ui/src/jetpack-compose/Button';
import { Checkbox } from '../../expo-ui/src/jetpack-compose/Checkbox';
import { Column } from '../../expo-ui/src/jetpack-compose/Column';
import { LoadingIndicator } from '../../expo-ui/src/jetpack-compose/LoadingIndicator';
import {
  CircularProgressIndicator,
  LinearProgressIndicator,
} from '../../expo-ui/src/jetpack-compose/Progress';
import { RadioButton } from '../../expo-ui/src/jetpack-compose/RadioButton';
import { Row } from '../../expo-ui/src/jetpack-compose/Row';
import { Spacer } from '../../expo-ui/src/jetpack-compose/Spacer';
import { Switch } from '../../expo-ui/src/jetpack-compose/Switch';
import { Text } from '../../expo-ui/src/jetpack-compose/Text';
import * as modifiers from '@expo/ui/jetpack-compose/modifiers';

import { installWidgetRuntime } from './runtime';

const jetpackCompose = {
  Box,
  Button,
  Checkbox,
  CircularProgressIndicator,
  Column,
  ElevatedButton,
  FilledTonalButton,
  LinearProgressIndicator,
  LoadingIndicator,
  OutlinedButton,
  RadioButton,
  Row,
  Spacer,
  Switch,
  Text,
  TextButton,
};

installWidgetRuntime(jetpackCompose, modifiers);
