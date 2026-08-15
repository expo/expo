import {
  Host,
  Slider,
  Shape,
  Row,
  Text as ComposeText,
  Column,
  Card,
  LazyColumn,
  Box,
} from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  height,
  padding,
  Shapes,
  size,
  weight,
} from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function SliderScreen() {
  const [steppedValue, setSteppedValue] = React.useState(0.5);
  const [rangeValue, setRangeValue] = React.useState(2);
  const [colorsValue, setColorsValue] = React.useState(0.5);
  const [fullCustomValue, setFullCustomValue] = React.useState(0.5);
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Default</ComposeText>
            <ComposeText>Default Material3 slider with no customization.</ComposeText>
            <Slider />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Stepped</ComposeText>
            <ComposeText>Discrete steps between min and max values.</ComposeText>
            <Slider
              value={steppedValue}
              steps={5}
              onValueChange={(v) => {
                setSteppedValue(v);
              }}
            />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom range</ComposeText>
            <ComposeText>Slider with min/max range from -1 to 5.</ComposeText>
            <Slider
              value={rangeValue}
              min={-1}
              max={5}
              onValueChange={(v) => {
                setRangeValue(v);
              }}
            />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom colors</ComposeText>
            <ComposeText>Override thumb, track, and tick colors via the colors prop.</ComposeText>
            <Slider
              value={colorsValue}
              colors={{
                thumbColor: '#ff0000',
                activeTrackColor: '#ffff00',
                inactiveTrackColor: '#ff00ff',
                activeTickColor: '#ff0000',
                inactiveTickColor: '#00ff00',
              }}
              onValueChange={(v) => {
                setColorsValue(v);
              }}
            />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Disabled</ComposeText>
            <ComposeText>Non-interactive slider using the enabled prop.</ComposeText>
            <Slider value={0.5} enabled={false} />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom thumb and track</ComposeText>
            <ComposeText>
              Fully custom slider with progress-colored track and circular thumb.
            </ComposeText>
            <Slider
              value={fullCustomValue}
              onValueChange={(v) => {
                setFullCustomValue(v);
              }}>
              <Slider.Thumb>
                <Box modifiers={[size(24, 24), clip(Shapes.Circle), background('#6200EE')]} />
              </Slider.Thumb>
              <Slider.Track>
                <Row modifiers={[fillMaxWidth(), height(8)]}>
                  <Shape.RoundedCorner
                    color="#6200EE"
                    cornerRadii={{ topStart: 4, bottomStart: 4 }}
                    modifiers={[weight(Math.max(fullCustomValue, 0.01)), height(8)]}
                  />
                  <Shape.RoundedCorner
                    color="#BDBDBD"
                    cornerRadii={{ topEnd: 4, bottomEnd: 4 }}
                    modifiers={[weight(Math.max(1 - fullCustomValue, 0.01)), height(8)]}
                  />
                </Row>
              </Slider.Track>
            </Slider>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

SliderScreen.navigationOptions = {
  title: 'Slider',
};
