import {
  HorizontalCenteredHeroCarousel,
  HorizontalMultiBrowseCarousel,
  HorizontalUncontainedCarousel,
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
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Multi-Browse</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Large item with smaller peek items alongside for browsing.
            </ComposeText>
            <HorizontalMultiBrowseCarousel
              preferredItemWidth={200}
              itemSpacing={8}
              modifiers={[fillMaxWidth()]}>
              <Box modifiers={[size(200, 200), background('#E91E63')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">1</ComposeText>
              </Box>
              <Box modifiers={[size(200, 200), background('#9C27B0')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">2</ComposeText>
              </Box>
              <Box modifiers={[size(200, 200), background('#673AB7')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">3</ComposeText>
              </Box>
              <Box modifiers={[size(200, 200), background('#3F51B5')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">4</ComposeText>
              </Box>
              <Box modifiers={[size(200, 200), background('#2196F3')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">5</ComposeText>
              </Box>
            </HorizontalMultiBrowseCarousel>
          </Column>
        </Card>
        <Card modifiers={[fillMaxWidth()]}>
          <Column verticalArrangement={{ spacedBy: 12 }} modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText style={{ typography: 'titleMedium' }}>Uncontained</ComposeText>
            <ComposeText style={{ typography: 'bodySmall' }} color="#666666">
              Fixed-width items that flow past the edge with free scrolling.
            </ComposeText>
            <HorizontalUncontainedCarousel
              itemWidth={150}
              itemSpacing={8}
              modifiers={[fillMaxWidth()]}>
              <Box modifiers={[size(150, 150), background('#FF6F00')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">1</ComposeText>
              </Box>
              <Box modifiers={[size(150, 150), background('#FF8F00')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">2</ComposeText>
              </Box>
              <Box modifiers={[size(150, 150), background('#FFA000')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">3</ComposeText>
              </Box>
              <Box modifiers={[size(150, 150), background('#FFB300')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">4</ComposeText>
              </Box>
              <Box modifiers={[size(150, 150), background('#FFC107')]} contentAlignment="center">
                <ComposeText color="#FFFFFF">5</ComposeText>
              </Box>
            </HorizontalUncontainedCarousel>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

CarouselScreen.navigationOptions = {
  title: 'Carousel',
};
