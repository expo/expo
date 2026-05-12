import {
  BasicAlertDialog,
  Button,
  TextButton,
  Host,
  Text as ComposeText,
  Column,
  Spacer,
  Card,
  LazyColumn,
  Surface,
} from '@expo/ui/jetpack-compose';
import {
  fillMaxWidth,
  padding,
  wrapContentWidth,
  wrapContentHeight,
  clip,
  height,
  align,
  Shapes,
} from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function BasicAlertDialogScreen() {
  const [dialogVisible, setDialogVisible] = React.useState(false);

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Basic Alert Dialog</ComposeText>
            <ComposeText>
              A minimal dialog with fully custom content. Unlike AlertDialog, there are no
              structured slots — you provide the entire layout.
            </ComposeText>
            <Button onClick={() => setDialogVisible(true)}>
              <ComposeText>Open dialog</ComposeText>
            </Button>
          </Column>
        </Card>
      </LazyColumn>

      {dialogVisible && (
        <BasicAlertDialog onDismissRequest={() => setDialogVisible(false)}>
          <Surface
            tonalElevation={6}
            modifiers={[wrapContentWidth(), wrapContentHeight(), clip(Shapes.RoundedCorner(28))]}>
            <Column modifiers={[padding(16, 16, 16, 16)]}>
              <ComposeText>
                This area typically contains the supportive text which presents the details
                regarding the Dialog's purpose.
              </ComposeText>
              <Spacer modifiers={[height(24)]} />
              <TextButton onClick={() => setDialogVisible(false)} modifiers={[align('centerEnd')]}>
                <ComposeText>Confirm</ComposeText>
              </TextButton>
            </Column>
          </Surface>
        </BasicAlertDialog>
      )}
    </Host>
  );
}

BasicAlertDialogScreen.navigationOptions = {
  title: 'BasicAlertDialog',
};
