import {
  TooltipBox,
  type TooltipBoxRef,
  Button,
  TextButton,
  Host,
  Text as ComposeText,
  Column,
  Row,
  Card,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';
import { useRef } from 'react';

export default function TooltipScreen() {
  const tooltipRef = useRef<TooltipBoxRef>(null);
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Plain Tooltip</ComposeText>
            <ComposeText>Long-press the button to show a plain tooltip.</ComposeText>
            <TooltipBox>
              <TooltipBox.PlainTooltip>
                <ComposeText>Add to favorites</ComposeText>
              </TooltipBox.PlainTooltip>
              <Button onClick={() => {}}>
                <ComposeText>Favorite</ComposeText>
              </Button>
            </TooltipBox>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Rich Tooltip</ComposeText>
            <ComposeText>
              Long-press the button to show a rich tooltip with title and body.
            </ComposeText>
            <TooltipBox>
              <TooltipBox.RichTooltip>
                <TooltipBox.RichTooltip.Title>
                  <ComposeText>Camera</ComposeText>
                </TooltipBox.RichTooltip.Title>
                <TooltipBox.RichTooltip.Text>
                  <ComposeText>Take photos and record videos with your device camera.</ComposeText>
                </TooltipBox.RichTooltip.Text>
              </TooltipBox.RichTooltip>
              <Button onClick={() => {}}>
                <ComposeText>Open Camera</ComposeText>
              </Button>
            </TooltipBox>
          </Column>
        </Card>

        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Rich Tooltip with Action</ComposeText>
            <ComposeText>
              Long-press the button to show a persistent rich tooltip with an action button.
            </ComposeText>
            <TooltipBox isPersistent>
              <TooltipBox.RichTooltip>
                <TooltipBox.RichTooltip.Title>
                  <ComposeText>Permissions Required</ComposeText>
                </TooltipBox.RichTooltip.Title>
                <TooltipBox.RichTooltip.Text>
                  <ComposeText>
                    This feature requires camera and microphone access to function properly.
                  </ComposeText>
                </TooltipBox.RichTooltip.Text>
                <TooltipBox.RichTooltip.Action>
                  <TextButton onClick={() => {}}>
                    <ComposeText>Learn More</ComposeText>
                  </TextButton>
                </TooltipBox.RichTooltip.Action>
              </TooltipBox.RichTooltip>
              <Button onClick={() => {}}>
                <ComposeText>Record Video</ComposeText>
              </Button>
            </TooltipBox>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Programmatic Show/Dismiss</ComposeText>
            <ComposeText>Use ref methods to control the tooltip imperatively.</ComposeText>
            <TooltipBox ref={tooltipRef} isPersistent>
              <TooltipBox.PlainTooltip>
                <ComposeText>Shown programmatically!</ComposeText>
              </TooltipBox.PlainTooltip>
              <Button onClick={() => {}}>
                <ComposeText>Anchor</ComposeText>
              </Button>
            </TooltipBox>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <Button onClick={() => tooltipRef.current?.show()}>
                <ComposeText>Show</ComposeText>
              </Button>
              <Button onClick={() => tooltipRef.current?.dismiss()}>
                <ComposeText>Dismiss</ComposeText>
              </Button>
            </Row>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

TooltipScreen.navigationOptions = {
  title: 'Tooltip',
};
