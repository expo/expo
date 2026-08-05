import { Host, Column, Box, Text } from '@expo/ui/jetpack-compose';
import {
  clickable,
  paddingAll,
  fillMaxWidth,
  fillMaxSize,
  height,
  graphicsLayer,
  clip,
  background,
  Shapes,
  animated,
  spring,
  tween,
} from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';

export default function GraphicsLayerScreen() {
  const [flipped, setFlipped] = useState(false);

  return (
    <>
      <Host style={{ flex: 1 }}>
        <Column
          horizontalAlignment="center"
          verticalArrangement="center"
          modifiers={[paddingAll(24)]}>
          <Box
            modifiers={[
              clickable(() => setFlipped((p) => !p), { indication: false }),
              fillMaxWidth(),
              height(200),
            ]}>
            <Box
              contentAlignment="center"
              modifiers={[
                graphicsLayer({
                  rotationY: animated(
                    flipped ? 180 : 0,
                    spring({ stiffness: 20, dampingRatio: 1 })
                  ),
                  alpha: animated(
                    flipped ? 0.5 : 1,
                    tween({ durationMillis: 300, easing: 'linear' })
                  ),
                  cameraDistance: 12,
                }),
                fillMaxSize(),
                clip(Shapes.RoundedCorner(20)),
                background('#007AFF'),
                paddingAll(24),
              ]}>
              <Text style={{ typography: 'headlineMedium', textAlign: 'center' }} color="#FFFFFF">
                Tap to flip
              </Text>
            </Box>
          </Box>
        </Column>
      </Host>
    </>
  );
}
GraphicsLayerScreen.navigationOptions = {
  title: 'graphicsLayer modifier',
};
