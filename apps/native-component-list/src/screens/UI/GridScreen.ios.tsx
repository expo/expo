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
  DisclosureGroup,
} from '@expo/ui/swift-ui';
import {
  background,
  clipShape,
  foregroundStyle,
  frame,
  gridCellAnchor,
  gridCellColumns,
  gridCellUnsizedAxes,
  padding,
  pickerStyle,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import { Image as ExpoImage } from 'expo-image';
import * as React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

type AnchorType = 'custom' | 'preset';

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

  const anchorOptions = [
    'zero',
    'leading',
    'center',
    'trailing',
    'topLeading',
    'top',
    'topTrailing',
    'bottomLeading',
    'bottom',
    'bottomTrailing',
  ] as const;

  const items = [
    {
      title: 'Exploring the Beauty of Nature',
      description:
        'The world is full of breathtaking landscapes, from towering mountains to vast oceans. Each place tells its own story through colors, textures, and light. Photography helps us capture and share these unique perspectives.',
      footer: 'Discovering nature allows us to reconnect with the world and ourselves.',
      img: require('../../../assets/images/example1.jpg'),
    },
    {
      title: 'Technology and the Future of Design',
      description:
        'Modern design is deeply influenced by technology. From AI-driven tools to 3D modeling, designers can now explore new levels of creativity. The challenge is to maintain a human touch while embracing innovation.',
      footer: 'Good design always serves people — not the other way around.',
      img: require('../../../assets/images/example2.jpg'),
    },
  ];

  const [gridCellAxesIndex, setGridCellAxesIndex] = React.useState(0);
  const [gridSpacing, setGridSpacing] = React.useState({ vertical: 5, horizontal: 5 });
  const [gridAnchor, setGridAnchor] = React.useState({ x: 0.25, y: 0.25 });
  const [alignmentIndex, setAlignmentIndex] = React.useState(0);
  const [anchorIndex, setAnchorIndex] = React.useState(0);
  const [anchorType, setAnchorType] = React.useState<AnchorType>('custom');
  const [disclosureGroupExpanded, setDisclosureGroupExpanded] = React.useState<{
    example1: boolean;
    example2: boolean;
  }>({
    example1: false,
    example2: false,
  });

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
              modifiers={[pickerStyle('menu')]}
              selection={gridCellAxesIndex}
              onSelectionChange={setGridCellAxesIndex}>
              {gridCellAxesOptions.map((option, index) => (
                <Text key={index} modifiers={[tag(index)]}>
                  {option}
                </Text>
              ))}
            </Picker>
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
            <VStack
              alignment="center"
              modifiers={[background('white'), clipShape('roundedRectangle')]}>
              <VStack modifiers={[padding({ all: 5 })]} alignment="center" spacing={20}>
                {(['horizontal', 'vertical'] as const).map((axis) => (
                  <HStack key={axis} spacing={30} alignment="center">
                    <Text>{`${axis}: ${gridSpacing[axis].toFixed(1)}`}</Text>
                    <Spacer minLength={40} />
                    <Slider
                      min={0}
                      max={10}
                      value={gridSpacing[axis]}
                      onValueChange={(v) => setGridSpacing((prev) => ({ ...prev, [axis]: v }))}
                    />
                  </HStack>
                ))}
                <HStack>
                  <Text>Alignment</Text>
                  <Spacer />
                  <Picker
                    modifiers={[pickerStyle('menu')]}
                    selection={alignmentIndex}
                    onSelectionChange={setAlignmentIndex}>
                    {alignmentOptions.map((option, index) => (
                      <Text key={index} modifiers={[tag(index)]}>
                        {option}
                      </Text>
                    ))}
                  </Picker>
                </HStack>

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
              </VStack>
            </VStack>
          </VStack>

          {/* Example small Grid */}
          <VStack alignment="leading" spacing={5}>
            <Text weight="bold">Anchor</Text>
            <VStack
              alignment="leading"
              modifiers={[background('white'), clipShape('roundedRectangle')]}>
              <VStack modifiers={[padding({ all: 5 })]} alignment="center" spacing={20}>
                <Picker
                  modifiers={[pickerStyle('segmented')]}
                  selection={anchorType === 'custom' ? 0 : 1}
                  onSelectionChange={(selection) =>
                    setAnchorType(selection === 0 ? 'custom' : 'preset')
                  }>
                  <Text modifiers={[tag(0)]}>Custom</Text>
                  <Text modifiers={[tag(1)]}>Preset</Text>
                </Picker>
                <VStack alignment="center">
                  {anchorType === 'preset' ? (
                    <Picker
                      modifiers={[pickerStyle('menu')]}
                      selection={anchorIndex}
                      onSelectionChange={setAnchorIndex}>
                      {anchorOptions.map((option, index) => (
                        <Text key={index} modifiers={[tag(index)]}>
                          {option}
                        </Text>
                      ))}
                    </Picker>
                  ) : (
                    <VStack spacing={12}>
                      {(['x', 'y'] as const).map((anchor) => (
                        <HStack key={anchor} spacing={30} alignment="center">
                          <Text>{`${anchor.toUpperCase()}: ${gridAnchor[anchor].toFixed(2)}`}</Text>
                          <Spacer minLength={40} />
                          <Slider
                            min={0}
                            max={1}
                            value={gridAnchor[anchor]}
                            onValueChange={(v) =>
                              setGridAnchor((prev) => ({ ...prev, [anchor]: v }))
                            }
                          />
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </VStack>
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
                        anchorType === 'custom'
                          ? gridCellAnchor({
                              type: 'custom',
                              points: { x: gridAnchor.x, y: gridAnchor.y },
                            })
                          : gridCellAnchor({ type: 'preset', anchor: anchorOptions[anchorIndex] }),
                      ]}
                    />
                  </Grid.Row>
                </Grid>
              </VStack>
            </VStack>
          </VStack>

          {/* Example 1 */}
          <DisclosureGroup
            onIsExpandedChange={(v) =>
              setDisclosureGroupExpanded((prev) => ({ ...prev, example1: v }))
            }
            isExpanded={disclosureGroupExpanded.example1}
            label="Example #1">
            <Grid horizontalSpacing={15} verticalSpacing={15} alignment="leading">
              {items.map((item, index) => (
                <Grid.Row key={index}>
                  <VStack
                    spacing={10}
                    modifiers={[
                      padding({ all: 15 }),
                      background('lightgray'),
                      clipShape('roundedRectangle'),
                    ]}>
                    <Text modifiers={[frame({ height: 60 })]}>{item.title}</Text>
                    <HStack spacing={10} alignment="top" modifiers={[frame({ height: 300 })]}>
                      {index % 2 === 0 ? (
                        <HStack spacing={10}>
                          <ExpoImage source={item.img} style={styles.imageExaple1} />
                          <Text>{item.description}</Text>
                        </HStack>
                      ) : (
                        <HStack spacing={10}>
                          <Text>{item.description}</Text>
                          <ExpoImage source={item.img} style={styles.imageExaple1} />
                        </HStack>
                      )}
                    </HStack>
                    <Text>{item.footer}</Text>
                  </VStack>
                </Grid.Row>
              ))}
            </Grid>
          </DisclosureGroup>

          {/* Example 2 */}
          <DisclosureGroup
            onIsExpandedChange={(v) =>
              setDisclosureGroupExpanded((prev) => ({ ...prev, example2: v }))
            }
            isExpanded={disclosureGroupExpanded.example2}
            label="Example #2">
            <Grid verticalSpacing={5} horizontalSpacing={5} alignment="center">
              <Grid.Row>
                <HStack modifiers={[frame({ height: 100 }), gridCellColumns(4)]}>
                  <ExpoImage source={items[1].img} style={styles.imageExaple2} />
                </HStack>
              </Grid.Row>
              <Grid.Row>
                <Rectangle
                  modifiers={[
                    frame({ height: 150 }),
                    gridCellColumns(1),
                    foregroundStyle({ type: 'color', color: 'lightgreen' }),
                  ]}
                />
                <ExpoImage
                  source={items[0].img}
                  style={[
                    styles.imageExaple2,
                    {
                      height: 300,
                      width: 250,
                    },
                  ]}
                />
                <Rectangle
                  modifiers={[
                    frame({ height: 150 }),
                    gridCellColumns(2),
                    foregroundStyle({ type: 'color', color: 'red' }),
                  ]}
                />
              </Grid.Row>
              <Text>Some text</Text>
              <Grid.Row>
                {[
                  { color: 'lightgreen', columns: 1 },
                  { color: 'orange', columns: 2 },
                  { color: 'red', columns: 1 },
                ].map(({ color, columns }, index) => (
                  <Rectangle
                    key={index}
                    modifiers={[
                      frame({ height: 150 }),
                      gridCellColumns(columns),
                      foregroundStyle({ type: 'color', color }),
                    ]}
                  />
                ))}
              </Grid.Row>
              <Grid.Row>
                <HStack modifiers={[frame({ height: 100 }), gridCellColumns(3)]}>
                  <ExpoImage source={items[1].img} style={styles.imageExaple2} />
                </HStack>
                <Rectangle
                  modifiers={[
                    frame({ height: 100 }),
                    gridCellColumns(1),
                    foregroundStyle({ type: 'color', color: 'red' }),
                  ]}
                />
              </Grid.Row>
            </Grid>
          </DisclosureGroup>
        </VStack>
      </Host>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageExaple1: {
    height: 300,
    width: 250,
    borderRadius: 12,
  },
  imageExaple2: {
    height: 100,
    width: '100%',
    borderRadius: 12,
  },
});

GridScreen.navigationOptions = {
  title: 'Grid',
};
