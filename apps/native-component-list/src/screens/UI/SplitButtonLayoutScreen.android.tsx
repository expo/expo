import {
  Column,
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Icon,
  SplitButtonLayout,
  Text as ComposeText,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, rotate } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

const dropDownIcon = require('../../../assets/icons/ui/arrow_drop_down.xml');

const OPTIONS = ['Squash and merge', 'Rebase and merge', 'Create a merge commit'];

export default function SplitButtonLayoutScreen() {
  const [expanded, setExpanded] = React.useState(false);
  const [option, setOption] = React.useState(OPTIONS[0]);
  const [count, setCount] = React.useState(0);

  return (
    <Host style={{ flex: 1 }}>
      <Column verticalArrangement={{ spacedBy: 16 }} modifiers={[padding(16, 16, 16, 16)]}>
        <ComposeText>Leading button with a menu on the trailing button</ComposeText>
        <SplitButtonLayout modifiers={[fillMaxWidth()]}>
          <SplitButtonLayout.LeadingButton
            onClick={() => setCount(count + 1)}
            modifiers={[fillMaxWidth()]}>
            <ComposeText>{option}</ComposeText>
          </SplitButtonLayout.LeadingButton>
          <SplitButtonLayout.TrailingButton checked={expanded} onCheckedChange={setExpanded}>
            <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
              <DropdownMenu.Trigger>
                <Icon
                  source={dropDownIcon}
                  contentDescription="Merge options"
                  modifiers={[rotate(expanded ? 180 : 0)]}
                />
              </DropdownMenu.Trigger>
              <DropdownMenu.Items>
                {OPTIONS.map((item) => (
                  <DropdownMenuItem
                    key={item}
                    onClick={() => {
                      setOption(item);
                      setExpanded(false);
                    }}>
                    <DropdownMenuItem.Text>
                      <ComposeText>{item}</ComposeText>
                    </DropdownMenuItem.Text>
                  </DropdownMenuItem>
                ))}
              </DropdownMenu.Items>
            </DropdownMenu>
          </SplitButtonLayout.TrailingButton>
        </SplitButtonLayout>
        <ComposeText>Leading button pressed {count} times.</ComposeText>

        <ComposeText>Custom colors and spacing</ComposeText>
        <SplitButtonLayout spacing={8}>
          <SplitButtonLayout.LeadingButton
            onClick={() => setCount(count + 1)}
            colors={{ containerColor: '#6200EE', contentColor: '#FFFFFF' }}>
            <ComposeText>Send</ComposeText>
          </SplitButtonLayout.LeadingButton>
          <SplitButtonLayout.TrailingButton
            checked={false}
            colors={{ containerColor: '#6200EE', contentColor: '#FFFFFF' }}>
            <Icon source={dropDownIcon} contentDescription="Send options" />
          </SplitButtonLayout.TrailingButton>
        </SplitButtonLayout>

        <ComposeText>Disabled</ComposeText>
        <SplitButtonLayout>
          <SplitButtonLayout.LeadingButton enabled={false}>
            <ComposeText>Unavailable</ComposeText>
          </SplitButtonLayout.LeadingButton>
          <SplitButtonLayout.TrailingButton checked={false} enabled={false}>
            <Icon source={dropDownIcon} contentDescription="Options" />
          </SplitButtonLayout.TrailingButton>
        </SplitButtonLayout>
      </Column>
    </Host>
  );
}
