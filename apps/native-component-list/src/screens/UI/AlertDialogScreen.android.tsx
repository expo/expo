import {
  AlertDialog,
  Button,
  TextButton,
  Host,
  Text as ComposeText,
  Icon,
  Column,
  Card,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const infoIcon = require('../../../assets/icons/api/Camera.png');

const longText =
  'We are in the alert dialog, this is a very long text that should be wrapped in the alert dialog. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

export default function AlertDialogScreen() {
  const [largeDialogVisible, setLargeDialogVisible] = React.useState(false);
  const [smallDialogVisible, setSmallDialogVisible] = React.useState(false);
  const [colorDialogVisible, setColorDialogVisible] = React.useState(false);
  const [iconDialogVisible, setIconDialogVisible] = React.useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Large Alert Dialog</ComposeText>
            <ComposeText>Dialog with a long scrollable body text.</ComposeText>
            <Button onClick={() => setLargeDialogVisible(true)}>
              <ComposeText>Open Large Alert Dialog</ComposeText>
            </Button>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Small Alert Dialog</ComposeText>
            <ComposeText>Simple dialog with a short message.</ComposeText>
            <Button onClick={() => setSmallDialogVisible(true)}>
              <ComposeText>Open Small Alert Dialog</ComposeText>
            </Button>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom Colors</ComposeText>
            <ComposeText>Dialog with custom container and text colors.</ComposeText>
            <Button onClick={() => setColorDialogVisible(true)}>
              <ComposeText>Open Custom Colors Dialog</ComposeText>
            </Button>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>With Icon</ComposeText>
            <ComposeText>Dialog with an icon slot.</ComposeText>
            <Button onClick={() => setIconDialogVisible(true)}>
              <ComposeText>Open Icon Dialog</ComposeText>
            </Button>
          </Column>
        </Card>
      </LazyColumn>

      {largeDialogVisible && (
        <AlertDialog onDismissRequest={() => setLargeDialogVisible(false)}>
          <AlertDialog.Title>
            <ComposeText>Large Alert Dialog</ComposeText>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <ComposeText>{longText}</ComposeText>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton onClick={() => setLargeDialogVisible(false)}>
              <ComposeText>Confirm</ComposeText>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setLargeDialogVisible(false)}>
              <ComposeText>Dismiss</ComposeText>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      )}

      {smallDialogVisible && (
        <AlertDialog onDismissRequest={() => setSmallDialogVisible(false)}>
          <AlertDialog.Title>
            <ComposeText>Small Alert Dialog</ComposeText>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <ComposeText>This is a small alert dialog</ComposeText>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton onClick={() => setSmallDialogVisible(false)}>
              <ComposeText>Confirm</ComposeText>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setSmallDialogVisible(false)}>
              <ComposeText>Dismiss</ComposeText>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      )}

      {colorDialogVisible && (
        <AlertDialog
          onDismissRequest={() => setColorDialogVisible(false)}
          colors={{
            containerColor: '#1E1E2E',
            titleContentColor: '#CDD6F4',
            textContentColor: '#BAC2DE',
          }}>
          <AlertDialog.Title>
            <ComposeText>Custom Colors</ComposeText>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <ComposeText>This dialog uses custom container and text colors.</ComposeText>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton onClick={() => setColorDialogVisible(false)}>
              <ComposeText>OK</ComposeText>
            </TextButton>
          </AlertDialog.ConfirmButton>
          <AlertDialog.DismissButton>
            <TextButton onClick={() => setColorDialogVisible(false)}>
              <ComposeText>Cancel</ComposeText>
            </TextButton>
          </AlertDialog.DismissButton>
        </AlertDialog>
      )}

      {iconDialogVisible && (
        <AlertDialog onDismissRequest={() => setIconDialogVisible(false)}>
          <AlertDialog.Icon>
            <Icon source={infoIcon} />
          </AlertDialog.Icon>
          <AlertDialog.Title>
            <ComposeText>Dialog with Icon</ComposeText>
          </AlertDialog.Title>
          <AlertDialog.Text>
            <ComposeText>This dialog has an icon above the title.</ComposeText>
          </AlertDialog.Text>
          <AlertDialog.ConfirmButton>
            <TextButton onClick={() => setIconDialogVisible(false)}>
              <ComposeText>OK</ComposeText>
            </TextButton>
          </AlertDialog.ConfirmButton>
        </AlertDialog>
      )}
    </Host>
  );
}

AlertDialogScreen.navigationOptions = {
  title: 'AlertDialog',
};
