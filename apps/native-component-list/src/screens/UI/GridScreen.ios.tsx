import {
  Grid,
  Host,
  VStack,
  Text,
  Circle,
  HStack,
  Image,
  Divider,
  Spacer,
  Picker,
  Rectangle,
  Slider,
} from '@expo/ui/swift-ui';
import {
  background,
  clipShape,
  foregroundStyle,
  frame,
  gridCellColumns,
  gridCellUnsizedAxes,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';
import { ScrollView } from 'react-native';

export default function GridScreen() {
  const gridCellAxesOptions = ['vertical', 'horizontal'] as const;
  const alignmentOptions = [
    'center',
    'leading',
    'trailing',
    'top',
    'bottom',
    'topLeading',
    'topTrailing',
    'bottomLeading',
    'bottomTrailing',
    'centerFirstTextBaseline',
    'centerLastTextBaseline',
    'leadingFirstTextBaseline',
    'leadingLastTextBaseline',
    'trailingFirstTextBaseline',
    'trailingLastTextBaseline',
  ] as const;

  const [gridCellAxesIndex, setGridCellAxesIndex] = React.useState(0);
  const [gridSpacing, setGridSpacing] = React.useState({ vertical: 5, horizontal: 5 });
  const [alignmentIndex, setAlignmentIndex] = React.useState(0);

  const renderGridMatrix = (rows: number, cols: number) =>
    Array.from({ length: rows }).map((_, r) => (
      <Grid.Row key={r}>
        {Array.from({ length: cols }).map((_, c) => (
          <Text key={c}>{`(${c}, ${r})`}</Text>
        ))}
      </Grid.Row>
    ));

  const renderCircleGrid = (rows: number, cols: number) =>
    Array.from({ length: rows }).map((_, r) => (
      <Grid.Row key={r}>
        <Text>{`R${r + 1}`}</Text>
        {Array.from({ length: cols }).map((_, c) => (
          <Circle
            key={c}
            modifiers={[
              foregroundStyle({ type: 'color', color: 'mint' }),
              frame({ width: 40, height: 40 }),
            ]}
          />
        ))}
      </Grid.Row>
    ));

  const renderRectangleRow = (label: string, count: number, color: string) => (
    <Grid.Row>
      <Text>{label}</Text>
      {Array.from({ length: count }).map((_, i) => (
        <Rectangle
          key={i}
          modifiers={[foregroundStyle({ type: 'color', color }), frame({ width: 50, height: 50 })]}
        />
      ))}
    </Grid.Row>
  );

  return (
    <ScrollView>
      <Host matchContents>
        <VStack spacing={30} modifiers={[padding({ all: 15 })]}>
          <HStack
            modifiers={[background('lightgray'), clipShape('roundedRectangle')]}
            alignment="center">
            <Grid modifiers={[frame({ width: 200, height: 100 })]}>
              <Grid.Row>
                <Text>Hello</Text>
                <Image systemName="globe" />
              </Grid.Row>
              <Divider modifiers={[gridCellUnsizedAxes(gridCellAxesOptions[gridCellAxesIndex])]} />
              <Grid.Row>
                <Image systemName="hand.wave" />
                <Text>World</Text>
              </Grid.Row>
            </Grid>
            <Spacer />
            <Picker
              options={[...gridCellAxesOptions]}
              selectedIndex={gridCellAxesIndex}
              onOptionSelected={(e) => setGridCellAxesIndex(e.nativeEvent.index)}
              variant="menu"
            />
          </HStack>

          {/* 3x3 Grid and Circle Grid */}
          <HStack spacing={15}>
            <HStack
              modifiers={[background('lightgray'), clipShape('roundedRectangle')]}
              alignment="center">
              <Grid
                horizontalSpacing={15}
                verticalSpacing={15}
                alignment="topLeading"
                modifiers={[padding({ all: 10 })]}>
                {renderGridMatrix(3, 3)}
              </Grid>
            </HStack>
            <HStack
              modifiers={[background('lightgray'), clipShape('roundedRectangle')]}
              alignment="center">
              <Grid horizontalSpacing={5} verticalSpacing={5} modifiers={[padding({ all: 5 })]}>
                <Grid.Row>
                  <VStack modifiers={[frame({ width: 20, height: 20 })]}>{null}</VStack>
                  {Array.from({ length: 3 }).map((_, c) => (
                    <Text key={c}>{`C${c + 1}`}</Text>
                  ))}
                </Grid.Row>
                {renderCircleGrid(3, 3)}
              </Grid>
            </HStack>
          </HStack>

          {/* spacing and alignment */}
          <VStack spacing={10} alignment="leading">
            <Text size={16} weight="bold">
              Grid settings
            </Text>
            {['Horizontal', 'Vertical'].map((axis, idx) => (
              <HStack key={axis} spacing={30}>
                <Text>{`${axis}: ${axis === 'Horizontal' ? gridSpacing.horizontal.toFixed(1) : gridSpacing.vertical.toFixed(1)}`}</Text>
                <Spacer minLength={40} />
                <Slider
                  min={0}
                  max={10}
                  value={axis === 'Horizontal' ? gridSpacing.horizontal : gridSpacing.vertical}
                  onValueChange={(v) =>
                    setGridSpacing((prev) => ({
                      ...prev,
                      [axis.toLowerCase()]: v,
                    }))
                  }
                />
              </HStack>
            ))}

            <HStack>
              <Text>Alignment</Text>
              <Spacer />
              <Picker
                options={[...alignmentOptions]}
                selectedIndex={alignmentIndex}
                onOptionSelected={(e) => setAlignmentIndex(e.nativeEvent.index)}
                variant="menu"
              />
            </HStack>
          </VStack>

          {/* Colored Rectangles Grid */}
          <HStack modifiers={[background('lightgray'), clipShape('roundedRectangle')]}>
            <Grid
              alignment={alignmentOptions[alignmentIndex]}
              verticalSpacing={gridSpacing.vertical}
              horizontalSpacing={gridSpacing.horizontal}
              modifiers={[padding({ all: 5 })]}>
              {renderRectangleRow('Row 1', 2, 'red')}
              {renderRectangleRow('Row 2', 5, 'green')}
              {renderRectangleRow('Row 3', 4, 'blue')}
            </Grid>
          </HStack>

          {/* Example small Grid */}
          <Grid alignment="center" horizontalSpacing={1} verticalSpacing={1}>
            <Grid.Row>
              {Array.from({ length: 3 }).map((_, i) => (
                <Rectangle
                  key={i}
                  modifiers={[
                    foregroundStyle({ type: 'color', color: 'red' }),
                    frame({ width: 60, height: 60 }),
                  ]}
                />
              ))}
            </Grid.Row>
            <Grid.Row>
              <Rectangle
                modifiers={[
                  foregroundStyle({ type: 'color', color: 'red' }),
                  frame({ width: 60, height: 60 }),
                ]}
              />
              <Rectangle
                modifiers={[
                  gridCellColumns(2),
                  foregroundStyle({ type: 'color', color: 'blue' }),
                  frame({ width: 10, height: 10 }),
                ]}
              />
            </Grid.Row>
          </Grid>
        </VStack>
      </Host>
    </ScrollView>
  );
}

GridScreen.navigationOptions = {
  title: 'Grid',
};
