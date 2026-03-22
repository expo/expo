import {
  Badge,
  BadgedBox,
  Button,
  Column,
  Host,
  Icon,
  Row,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { padding, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const mailIcon = require('../../../assets/icons/ui/mail.xml');
const personIcon = require('../../../assets/icons/ui/person.xml');

export default function BadgeScreen() {
  const [count, setCount] = React.useState(3);

  return (
    <Host style={{ flex: 1, padding: 16 }}>
      <Column
        horizontalAlignment="center"
        verticalArrangement={{ spacedBy: 32 }}
        modifiers={[padding(0, 16, 0, 0)]}>
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

        {/* Badge with count (uses text prop for correct M3 sizing) */}
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }}>
          <BadgedBox>
            <BadgedBox.Badge>
              <Badge text="5" />
            </BadgedBox.Badge>
            <Icon source={personIcon} size={24} />
          </BadgedBox>
          <ComposeText>Badge with count</ComposeText>
        </Row>

        {/* Interactive counter */}
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }}>
          <BadgedBox>
            <BadgedBox.Badge>
              {count > 0 ? <Badge text={String(count)} /> : null}
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

        {/* Custom color dot (small badge avoids overlap) */}
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }}>
          <BadgedBox>
            <BadgedBox.Badge>
              <Badge containerColor="#4CAF50" />
            </BadgedBox.Badge>
            <Icon source={mailIcon} size={24} />
          </BadgedBox>
          <ComposeText>Custom color dot</ComposeText>
        </Row>

        {/* Large count badge (999+) */}
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 48 }}>
          <BadgedBox>
            <BadgedBox.Badge>
              <Badge text="999+" />
            </BadgedBox.Badge>
            <Icon source={mailIcon} size={24} />
          </BadgedBox>
          <ComposeText>Large count</ComposeText>
        </Row>

        {/* Large badge at trailing edge (no overlap with text) */}
        <Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 16 }}>
          <Icon source={mailIcon} size={24} />
          <ComposeText>Trailing badge</ComposeText>
          <Badge text="NEW" containerColor="#4CAF50" contentColor="#FFFFFF" />
        </Row>
      </Column>
    </Host>
  );
}

BadgeScreen.navigationOptions = {
  title: 'Badge',
};
