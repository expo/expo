import {
  Host,
  Surface,
  Box,
  Column,
  Row,
  LazyColumn,
  Switch,
  Slider,
  Text as ComposeText,
  Shape,
} from '@expo/ui/jetpack-compose';
import type { ShapeJSXElement } from '@expo/ui/jetpack-compose';
import { padding, fillMaxWidth, size } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const shapeEntries: { label: string; shape: ShapeJSXElement | undefined }[] = [
  { label: 'rectangle', shape: undefined },
  {
    label: 'rounded',
    shape: Shape.RoundedCorner({
      cornerRadii: { topStart: 12, topEnd: 12, bottomStart: 12, bottomEnd: 12 },
    }),
  },
  { label: 'pill', shape: Shape.Pill({}) },
  { label: 'circle', shape: Shape.Circle({ radius: 1 }) },
];

export default function SurfaceScreen() {
  const [tonalElevation, setTonalElevation] = React.useState(5);
  const [shadowElevation, setShadowElevation] = React.useState(0);
  const [hasBorder, setHasBorder] = React.useState(false);
  const [shapeIndex, setShapeIndex] = React.useState(1);
  const [selected, setSelected] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  const { label: shapeName, shape: currentShape } = shapeEntries[shapeIndex];
  const isCircle = shapeName === 'circle';
  const surfaceW = isCircle ? 160 : 280;
  const surfaceH = 160;

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Box contentAlignment="center" modifiers={[fillMaxWidth()]}>
          <Surface
            shape={currentShape}
            tonalElevation={tonalElevation}
            shadowElevation={shadowElevation}
            border={hasBorder ? { width: 2, color: '#6200EE' } : undefined}
            selected={selected}
            onClick={() => setSelected(!selected)}
            modifiers={[size(surfaceW, surfaceH)]}>
            <Box contentAlignment="center" modifiers={[size(surfaceW, surfaceH)]}>
              <ComposeText>{selected ? 'Selected' : 'Tap me'}</ComposeText>
            </Box>
          </Surface>
        </Box>

        <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[fillMaxWidth()]}>
          <ComposeText style={{ fontWeight: 'bold', fontSize: 14 }}>
            Tonal Elevation: {tonalElevation}
          </ComposeText>
          <Slider
            value={tonalElevation}
            onValueChange={setTonalElevation}
            min={0}
            max={12}
            steps={11}
          />

          <ComposeText style={{ fontWeight: 'bold', fontSize: 14 }}>
            Shadow Elevation: {shadowElevation}
          </ComposeText>
          <Slider
            value={shadowElevation}
            onValueChange={setShadowElevation}
            min={0}
            max={16}
            steps={15}
          />

          <ComposeText style={{ fontWeight: 'bold', fontSize: 14 }}>Shape: {shapeName}</ComposeText>
          <Slider
            value={shapeIndex}
            onValueChange={(v) => setShapeIndex(Math.round(v))}
            min={0}
            max={shapeEntries.length - 1}
            steps={shapeEntries.length - 2}
          />

          <Row horizontalArrangement={{ spacedBy: 12 }}>
            <Row horizontalArrangement={{ spacedBy: 12 }} verticalAlignment="center">
              <ComposeText style={{ fontWeight: 'bold', fontSize: 14 }}>Border</ComposeText>
              <Switch value={hasBorder} onCheckedChange={setHasBorder} />
            </Row>

            <Row horizontalArrangement={{ spacedBy: 12 }} verticalAlignment="center">
              <ComposeText style={{ fontWeight: 'bold', fontSize: 14 }}>Checked</ComposeText>
              <Switch value={checked} onCheckedChange={setChecked} />
            </Row>
          </Row>
        </Column>

        <Surface
          shape={Shape.RoundedCorner({
            cornerRadii: { topStart: 12, topEnd: 12, bottomStart: 12, bottomEnd: 12 },
          })}
          checked={checked}
          onCheckedChange={setChecked}
          color={checked ? '#C8E6C9' : undefined}
          border={checked ? { width: 2, color: '#388E3C' } : undefined}
          modifiers={[padding(16, 16, 16, 16), fillMaxWidth()]}>
          <ComposeText>{checked ? 'Checked ✓' : 'Toggleable surface'}</ComposeText>
        </Surface>
      </LazyColumn>
    </Host>
  );
}

SurfaceScreen.navigationOptions = {
  title: 'Surface',
};
