import {
  TooltipBox,
  type TooltipBoxRef,
  PlainTooltip,
  RichTooltip,
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
              <TooltipBox.Tooltip>
                <PlainTooltip>
                  <ComposeText>Add to favorites</ComposeText>
                </PlainTooltip>
              </TooltipBox.Tooltip>
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
              <TooltipBox.Tooltip>
                <RichTooltip>
                  <RichTooltip.Title>
                    <ComposeText>Camera</ComposeText>
                  </RichTooltip.Title>
                  <RichTooltip.Text>
                    <ComposeText>
                      Take photos and record videos with your device camera.
                    </ComposeText>
                  </RichTooltip.Text>
                </RichTooltip>
              </TooltipBox.Tooltip>
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
              <TooltipBox.Tooltip>
                <RichTooltip>
                  <RichTooltip.Title>
                    <ComposeText>Permissions Required</ComposeText>
                  </RichTooltip.Title>
                  <RichTooltip.Text>
                    <ComposeText>
                      This feature requires camera and microphone access to function properly.
                    </ComposeText>
                  </RichTooltip.Text>
                  <RichTooltip.Action>
                    <TextButton onClick={() => {}}>
                      <ComposeText>Learn More</ComposeText>
                    </TextButton>
                  </RichTooltip.Action>
                </RichTooltip>
              </TooltipBox.Tooltip>
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
              <TooltipBox.Tooltip>
                <PlainTooltip>
                  <ComposeText>Shown programmatically!</ComposeText>
                </PlainTooltip>
              </TooltipBox.Tooltip>
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
