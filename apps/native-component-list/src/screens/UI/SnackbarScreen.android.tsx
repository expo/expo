import {
  Box,
  Button,
  Column,
  Host,
  Snackbar,
  SnackbarHost,
  type SnackbarHostRef,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { align, fillMaxSize, fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function SnackbarScreen() {
  const defaultHostRef = React.useRef<SnackbarHostRef>(null);
  const styledHostRef = React.useRef<SnackbarHostRef>(null);
  const [lastResult, setLastResult] = React.useState<string>('');

  const showShort = async () => {
    const result = await defaultHostRef.current?.showSnackbar({
      message: 'Item archived',
      actionLabel: 'Undo',
      duration: 'short',
    });
    setLastResult(`short: ${result ?? 'no host'}`);
  };

  const showWithDismissAction = async () => {
    const result = await defaultHostRef.current?.showSnackbar({
      message: 'New email received',
      withDismissAction: true,
      duration: 'long',
    });
    setLastResult(`long+dismiss: ${result ?? 'no host'}`);
  };

  const showIndefinite = async () => {
    const result = await defaultHostRef.current?.showSnackbar({
      message: 'Connection lost, tap to retry',
      actionLabel: 'Retry',
      duration: 'indefinite',
    });
    setLastResult(`indefinite: ${result ?? 'no host'}`);
  };

  const showStyled = async () => {
    const result = await styledHostRef.current?.showSnackbar({
      message: 'Saved with custom colors',
      actionLabel: 'OK',
      duration: 'short',
    });
    setLastResult(`styled: ${result ?? 'no host'}`);
  };

  return (
    <Host style={{ flex: 1 }}>
      <Box modifiers={[fillMaxSize()]}>
        <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
          <ComposeText style={{ fontSize: 18, fontWeight: '600' }}>Default styling</ComposeText>
          <Button onClick={showShort}>
            <ComposeText>Show short snackbar with Undo</ComposeText>
          </Button>
          <Button onClick={showWithDismissAction}>
            <ComposeText>Show long snackbar with dismiss icon</ComposeText>
          </Button>
          <Button onClick={showIndefinite}>
            <ComposeText>Show indefinite snackbar with Retry</ComposeText>
          </Button>

          <ComposeText style={{ fontSize: 18, fontWeight: '600' }}>Custom styling</ComposeText>
          <ComposeText>Pass a Snackbar child to SnackbarHost to override colors.</ComposeText>
          <Button onClick={showStyled}>
            <ComposeText>Show styled snackbar</ComposeText>
          </Button>

          <ComposeText>Last result: {lastResult || '-'}</ComposeText>
        </Column>

        <Box modifiers={[align('bottomCenter'), fillMaxWidth()]}>
          <SnackbarHost ref={defaultHostRef} />
        </Box>
        <Box modifiers={[align('bottomCenter'), fillMaxWidth()]}>
          <SnackbarHost ref={styledHostRef}>
            <Snackbar
              containerColor="#322F35"
              contentColor="#E6E0E9"
              actionContentColor="#D0BCFF"
              dismissActionContentColor="#E6E0E9"
            />
          </SnackbarHost>
        </Box>
      </Box>
    </Host>
  );
}

SnackbarScreen.navigationOptions = {
  title: 'Snackbar',
};
