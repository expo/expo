import { Card, Column, Host, Image, LazyColumn, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, size } from '@expo/ui/jetpack-compose/modifiers';

const photo = require('../../../assets/images/example1.jpg');

export default function ImageScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        {(['fit', 'crop', 'fillBounds'] as const).map((contentScale) => (
          <Card key={contentScale} modifiers={[fillMaxWidth()]}>
            <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[padding(16, 16, 16, 16)]}>
              <Text>{contentScale}</Text>
              <Image
                source={photo}
                contentScale={contentScale}
                contentDescription={`Example image using ${contentScale}`}
                modifiers={[size(240, 120)]}
              />
            </Column>
          </Card>
        ))}
      </LazyColumn>
    </Host>
  );
}

ImageScreen.navigationOptions = {
  title: 'Image',
};
