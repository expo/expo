import { Box } from '../../expo-ui/src/jetpack-compose/Box';
import { Button } from '../../expo-ui/src/jetpack-compose/Button';
import { Column } from '../../expo-ui/src/jetpack-compose/Column';
import { Row } from '../../expo-ui/src/jetpack-compose/Row';
import { Spacer } from '../../expo-ui/src/jetpack-compose/Spacer';
import { Text } from '../../expo-ui/src/jetpack-compose/Text';
import * as modifiers from '@expo/ui/jetpack-compose/modifiers';

import { installWidgetRuntime } from './runtime';

const jetpackCompose = {
  Box,
  Button,
  Column,
  Row,
  Spacer,
  Text,
};

installWidgetRuntime(jetpackCompose, modifiers);
