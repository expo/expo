import {
  Badge,
  BadgedBox,
  Box,
  Button,
  Column,
  Host,
  Icon,
  Row,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const mailIcon = require('../../../assets/icons/ui/mail.xml');
const personIcon = require('../../../assets/icons/ui/person.xml');

export default function BadgeScreen() {
  const [count, setCount] = React.useState(3);

  return (
    <Host style={{ flex: 1, padding: 16 }}>
      <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 32 }}>
        {/* Simple dot badge */}
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }}>
          <BadgedBox>
            <BadgedBox.Badge>
              <Badge />
            </BadgedBox.Badge>
            <Icon source={mailIcon} size={24} />
          </BadgedBox>
          <ComposeText>Dot indicator</ComposeText>
        </Row>

        {/* Badge with count */}
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }}>
          <BadgedBox>
            <BadgedBox.Badge>
              <Badge>
                <ComposeText>5</ComposeText>
              </Badge>
            </BadgedBox.Badge>
            <Icon source={personIcon} size={24} />
          </BadgedBox>
          <ComposeText>Badge with count</ComposeText>
        </Row>

        {/* Interactive counter */}
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }}>
          <BadgedBox>
            <BadgedBox.Badge>
              {count > 0 ? (
                <Badge>
                  <ComposeText>{String(count)}</ComposeText>
                </Badge>
              ) : null}
            </BadgedBox.Badge>
            <Icon source={mailIcon} size={24} />
          </BadgedBox>
          <ComposeText>Interactive: {count}</ComposeText>
        </Row>

        <Row horizontalArrangement={{ spacedBy: 8 }}>
          <Button onClick={() => setCount(c => c + 1)} modifiers={[paddingAll(8)]}>
            <ComposeText>Add</ComposeText>
          </Button>
          <Button
            onClick={() => setCount(c => Math.max(0, c - 1))}
            modifiers={[paddingAll(8)]}>
            <ComposeText>Remove</ComposeText>
          </Button>
        </Row>

        {/* Custom colors */}
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }}>
          <BadgedBox>
            <BadgedBox.Badge>
              <Badge containerColor="#4CAF50" contentColor="#FFFFFF">
                <ComposeText>NEW</ComposeText>
              </Badge>
            </BadgedBox.Badge>
            <Icon source={mailIcon} size={24} />
          </BadgedBox>
          <ComposeText>Custom colors</ComposeText>
        </Row>
      </Column>
    </Host>
  );
}

BadgeScreen.navigationOptions = {
  title: 'Badge',
};
