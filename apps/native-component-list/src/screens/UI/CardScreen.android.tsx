import {
  Host,
  Card,
  ElevatedCard,
  OutlinedCard,
  Text as ComposeText,
  Column,
  LazyColumn,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding } from '@expo/ui/jetpack-compose/modifiers';

export default function CardScreen() {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <Card modifiers={[fillMaxWidth()]}>
          <Column modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Default card</ComposeText>
            <ComposeText>A filled card with no outline or elevation.</ComposeText>
          </Column>
        </Card>
        <ElevatedCard modifiers={[fillMaxWidth()]}>
          <Column modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Elevated card</ComposeText>
            <ComposeText>A filled card with shadow elevation.</ComposeText>
          </Column>
        </ElevatedCard>
        <OutlinedCard modifiers={[fillMaxWidth()]}>
          <Column modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Outlined card</ComposeText>
            <ComposeText>A card with a border outline.</ComposeText>
          </Column>
        </OutlinedCard>
        <Card
          modifiers={[fillMaxWidth()]}
          colors={{ containerColor: '#EDE9FE', contentColor: '#4C1D95' }}>
          <Column modifiers={[padding(16, 16, 16, 16)]}>
            <ComposeText>Custom colors</ComposeText>
            <ComposeText>Card with custom container and content colors.</ComposeText>
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

CardScreen.navigationOptions = {
  title: 'Card',
};
