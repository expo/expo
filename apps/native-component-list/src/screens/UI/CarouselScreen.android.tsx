import {
  HorizontalCenteredHeroCarousel,
  Box,
  Host,
  Card,
  Column,
  LazyColumn,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { background, fillMaxWidth, padding, size } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function CarouselScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Centered Hero</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              One large centered item with small peek items on each side.
            </ComposeText>
            <HorizontalCenteredHeroCarousel itemSpacing={8} modifiers={[fillMaxWidth()]}>
              <Box modifiers={[size(300, 200), background('#6200EE')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">1</ComposeText>
              </Box>
              <Box modifiers={[size(300, 200), background('#03DAC5')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">2</ComposeText>
              </Box>
              <Box modifiers={[size(300, 200), background('#FF5722')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">3</ComposeText>
              </Box>
              <Box modifiers={[size(300, 200), background('#4CAF50')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">4</ComposeText>
              </Box>
              <Box modifiers={[size(300, 200), background('#2196F3')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">5</ComposeText>
              </Box>
            </HorizontalCenteredHeroCarousel>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

CarouselScreen.navigationOptions = {
  title: 'Carousel',
};
