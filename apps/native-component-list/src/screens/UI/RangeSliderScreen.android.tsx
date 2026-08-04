import {
  Host,
  RangeSlider,
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

export default function RangeSliderScreen() {
  const [steppedValue, setSteppedValue] = React.useState({ start: 0.2, end: 0.8 });
  const [priceValue, setPriceValue] = React.useState({ start: 20, end: 80 });
  const [colorsValue, setColorsValue] = React.useState({ start: 0.25, end: 0.75 });
  const [fullCustomValue, setFullCustomValue] = React.useState({ start: 0.3, end: 0.7 });
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Default</ComposeText>
            <ComposeText>Default Material3 range slider with no customization.</ComposeText>
            <RangeSlider />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Stepped</ComposeText>
            <ComposeText>Discrete steps between min and max values.</ComposeText>
            <RangeSlider value={steppedValue} steps={5} onValueChange={setSteppedValue} />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom range</ComposeText>
            <ComposeText>
              Price filter from 0 to 100, currently {Math.round(priceValue.start)} to{' '}
              {Math.round(priceValue.end)}.
            </ComposeText>
            <RangeSlider value={priceValue} min={0} max={100} onValueChange={setPriceValue} />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom colors</ComposeText>
            <ComposeText>Override thumb, track, and tick colors via the colors prop.</ComposeText>
            <RangeSlider
              value={colorsValue}
              colors={{
                thumbColor: '#ff0000',
                activeTrackColor: '#ffff00',
                inactiveTrackColor: '#ff00ff',
                activeTickColor: '#ff0000',
                inactiveTickColor: '#00ff00',
              }}
              onValueChange={setColorsValue}
            />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Disabled</ComposeText>
            <ComposeText>Non-interactive range slider using the enabled prop.</ComposeText>
            <RangeSlider value={{ start: 0.25, end: 0.75 }} enabled={false} />
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom thumbs and track</ComposeText>
            <ComposeText>
              Square start thumb, circular end thumb, and a three-segment track.
            </ComposeText>
            <RangeSlider value={fullCustomValue} onValueChange={setFullCustomValue}>
              <RangeSlider.StartThumb>
                <Box modifiers={[size(24, 24), clip(Shapes.Circle), background('#03DAC6')]} />
              </RangeSlider.StartThumb>
              <RangeSlider.EndThumb>
                <Box modifiers={[size(24, 24), clip(Shapes.Circle), background('#6200EE')]} />
              </RangeSlider.EndThumb>
              <RangeSlider.Track>
                <Row modifiers={[fillMaxWidth(), height(8)]}>
                  <Shape.RoundedCorner
                    color="#BDBDBD"
                    cornerRadii={{ topStart: 4, bottomStart: 4 }}
                    modifiers={[weight(Math.max(fullCustomValue.start, 0.01)), height(8)]}
                  />
                  <Shape.Rectangle
                    color="#6200EE"
                    modifiers={[
                      weight(Math.max(fullCustomValue.end - fullCustomValue.start, 0.01)),
                      height(8),
                    ]}
                  />
                  <Shape.RoundedCorner
                    color="#BDBDBD"
                    cornerRadii={{ topEnd: 4, bottomEnd: 4 }}
                    modifiers={[weight(Math.max(1 - fullCustomValue.end, 0.01)), height(8)]}
                  />
                </Row>
              </RangeSlider.Track>
            </RangeSlider>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

RangeSliderScreen.navigationOptions = {
  title: 'RangeSlider',
};
