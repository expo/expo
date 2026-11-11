import {
  Box,
  Button,
  Card,
  Column,
  Host,
  LazyColumn,
  RangeSlider,
  type RangeSliderRange,
  Row,
  Text,
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
  const [range, setRange] = React.useState<RangeSliderRange>({ start: 20, endInclusive: 40 });
  const [steppedRange, setSteppedRange] = React.useState<RangeSliderRange>({
    start: 20,
    endInclusive: 80,
  });
  const [finishedCount, setFinishedCount] = React.useState(0);
  const [trackEnd, setTrackEnd] = React.useState(100);
  const [steps, setSteps] = React.useState(9);
  const [colorsEnabled, setColorsEnabled] = React.useState(true);
  const [customRange, setCustomRange] = React.useState<RangeSliderRange>({
    start: 0.2,
    endInclusive: 0.8,
  });

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text>Continuous</Text>
            <Text>
              Selected: {range.start.toFixed(1)}–{range.endInclusive.toFixed(1)}
            </Text>
            <RangeSlider
              startValue={range.start}
              endValue={range.endInclusive}
              trackRange={{ start: 0, endInclusive: trackEnd }}
              onValueChange={setRange}
              onValueChangeFinished={() => setFinishedCount((count) => count + 1)}
            />
            <Text>Finished interactions: {finishedCount}</Text>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <Button
                onClick={() => setRange({ start: trackEnd * 0.2, endInclusive: trackEnd * 0.4 })}>
                <Text>Low range</Text>
              </Button>
              <Button
                onClick={() => setRange({ start: trackEnd * 0.6, endInclusive: trackEnd * 0.8 })}>
                <Text>High range</Text>
              </Button>
            </Row>
            <Button
              onClick={() => {
                const nextEnd = trackEnd === 100 ? 50 : 100;
                setTrackEnd(nextEnd);
                setRange({ start: nextEnd * 0.2, endInclusive: nextEnd * 0.4 });
              }}>
              <Text>Track maximum: {trackEnd}</Text>
            </Button>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text>Stepped</Text>
            <Text>
              Selected steps: {Math.round(steppedRange.start)}–
              {Math.round(steppedRange.endInclusive)}
            </Text>
            <RangeSlider
              startValue={steppedRange.start}
              endValue={steppedRange.endInclusive}
              trackRange={{ start: 0, endInclusive: 100 }}
              steps={steps}
              onValueChange={setSteppedRange}
            />
            <Button onClick={() => setSteps((value) => (value === 0 ? 9 : 0))}>
              <Text>Steps: {steps}</Text>
            </Button>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text>Custom colors</Text>
            <RangeSlider
              startValue={0.2}
              endValue={0.8}
              steps={9}
              enabled={colorsEnabled}
              colors={{
                thumbColor: '#6750A4',
                activeTrackColor: '#6750A4',
                inactiveTrackColor: '#E8DEF8',
                activeTickColor: '#FFFFFF',
                inactiveTickColor: '#6750A4',
                disabledThumbColor: '#006A60',
                disabledActiveTrackColor: '#80CBC4',
                disabledInactiveTrackColor: '#E0F2F1',
                disabledActiveTickColor: '#004D40',
                disabledInactiveTickColor: '#80CBC4',
              }}
            />
            <Button onClick={() => setColorsEnabled((value) => !value)}>
              <Text>{colorsEnabled ? 'Disable' : 'Enable'} custom colors</Text>
            </Button>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text>Custom thumbs and track</Text>
            <Text>
              Custom selection: {customRange.start.toFixed(2)}–{customRange.endInclusive.toFixed(2)}
            </Text>
            <RangeSlider
              startValue={customRange.start}
              endValue={customRange.endInclusive}
              onValueChange={setCustomRange}>
              <RangeSlider.StartThumb>
                <Box modifiers={[size(24, 24), clip(Shapes.Circle), background('#6750A4')]} />
              </RangeSlider.StartThumb>
              <RangeSlider.EndThumb>
                <Box modifiers={[size(24, 24), clip(Shapes.Circle), background('#006A60')]} />
              </RangeSlider.EndThumb>
              <RangeSlider.Track>
                <Row modifiers={[fillMaxWidth(), height(6)]}>
                  <Box
                    modifiers={[
                      weight(Math.max(customRange.start, 0.001)),
                      height(6),
                      background('#E8DEF8'),
                    ]}
                  />
                  <Box
                    modifiers={[
                      weight(Math.max(customRange.endInclusive - customRange.start, 0.001)),
                      height(6),
                      background('#6750A4'),
                    ]}
                  />
                  <Box
                    modifiers={[
                      weight(Math.max(1 - customRange.endInclusive, 0.001)),
                      height(6),
                      background('#E8DEF8'),
                    ]}
                  />
                </Row>
              </RangeSlider.Track>
            </RangeSlider>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <Text>Disabled</Text>
            <RangeSlider startValue={0.2} endValue={0.8} enabled={false} />
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

RangeSliderScreen.navigationOptions = {
  title: 'RangeSlider',
};
