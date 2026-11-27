import {
  Column,
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Icon,
  SplitButtonLayout,
  SplitButtonLeadingButton,
  SplitButtonTrailingButton,
  Text as ComposeText,
  TooltipBox,
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
          <SplitButtonLayout.LeadingButton>
            <SplitButtonLeadingButton
              onClick={() => setCount(count + 1)}
              modifiers={[fillMaxWidth()]}>
              <ComposeText>{option}</ComposeText>
            </SplitButtonLeadingButton>
          </SplitButtonLayout.LeadingButton>
          <SplitButtonLayout.TrailingButton>
            <DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
              <DropdownMenu.Trigger>
                <SplitButtonTrailingButton checked={expanded} onCheckedChange={setExpanded}>
                  <Icon
                    source={dropDownIcon}
                    contentDescription="Merge options"
                    modifiers={[rotate(expanded ? 180 : 0)]}
                  />
                </SplitButtonTrailingButton>
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

        <ComposeText>Tooltip on the trailing button</ComposeText>
        <SplitButtonLayout>
          <SplitButtonLayout.LeadingButton>
            <SplitButtonLeadingButton onClick={() => setCount(count + 1)}>
              <ComposeText>Save</ComposeText>
            </SplitButtonLeadingButton>
          </SplitButtonLayout.LeadingButton>
          <SplitButtonLayout.TrailingButton>
            <TooltipBox>
              <TooltipBox.PlainTooltip>
                <ComposeText>More save options</ComposeText>
              </TooltipBox.PlainTooltip>
              <SplitButtonTrailingButton checked={false}>
                <Icon source={dropDownIcon} contentDescription="Save options" />
              </SplitButtonTrailingButton>
            </TooltipBox>
          </SplitButtonLayout.TrailingButton>
        </SplitButtonLayout>

        <ComposeText>Custom colors and spacing</ComposeText>
        <SplitButtonLayout spacing={8}>
          <SplitButtonLayout.LeadingButton>
            <SplitButtonLeadingButton
              onClick={() => setCount(count + 1)}
              colors={{ containerColor: '#6200EE', contentColor: '#FFFFFF' }}>
              <ComposeText>Send</ComposeText>
            </SplitButtonLeadingButton>
          </SplitButtonLayout.LeadingButton>
          <SplitButtonLayout.TrailingButton>
            <SplitButtonTrailingButton
              checked={false}
              colors={{ containerColor: '#6200EE', contentColor: '#FFFFFF' }}>
              <Icon source={dropDownIcon} contentDescription="Send options" />
            </SplitButtonTrailingButton>
          </SplitButtonLayout.TrailingButton>
        </SplitButtonLayout>

        <ComposeText>Disabled</ComposeText>
        <SplitButtonLayout>
          <SplitButtonLayout.LeadingButton>
            <SplitButtonLeadingButton enabled={false}>
              <ComposeText>Unavailable</ComposeText>
            </SplitButtonLeadingButton>
          </SplitButtonLayout.LeadingButton>
          <SplitButtonLayout.TrailingButton>
            <SplitButtonTrailingButton checked={false} enabled={false}>
              <Icon source={dropDownIcon} contentDescription="Options" />
            </SplitButtonTrailingButton>
          </SplitButtonLayout.TrailingButton>
        </SplitButtonLayout>
      </Column>
    </Host>
  );
}
