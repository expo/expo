import {
  TextField,
  TextFieldRef,
  TextFieldKeyboardType,
  TextFieldImeAction,
  TextFieldCapitalization,
  TextFieldValue,
  OutlinedTextField,
  Button,
  Host,
  Card,
  Switch,
  LazyColumn,
  FilterChip,
  Row,
  Column,
  FlowRow,
  Text as ComposeText,
  useNativeState,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, padding, weight } from '@expo/ui/jetpack-compose/modifiers';
import * as React from 'react';

export default function TextFieldScreen() {
  const fieldValue = useNativeState('defaultvalue');
  const [textValue, setTextValue] = React.useState('');
  const [focusedState, setFocusedState] = React.useState(false);
  const [lastAction, setLastAction] = React.useState('');
  const textRef = React.useRef<TextFieldRef>(null);

  const maskedPhone = useNativeState<TextFieldValue>({
    text: '',
    selection: { start: 0, end: 0 },
  });

  const [outlined, setOutlined] = React.useState(false);
  const [enabled, setEnabled] = React.useState(true);
  const [readOnly, setReadOnly] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [singleLine, setSingleLine] = React.useState(true);
  const [autoCorrectEnabled, setAutoCorrectEnabled] = React.useState(true);

  const [showLabel, setShowLabel] = React.useState(true);
  const [showPlaceholder, setShowPlaceholder] = React.useState(true);
  const [showLeadingIcon, setShowLeadingIcon] = React.useState(false);
  const [showTrailingIcon, setShowTrailingIcon] = React.useState(false);
  const [showSupportingText, setShowSupportingText] = React.useState(false);
  const [showPrefix, setShowPrefix] = React.useState(false);
  const [showSuffix, setShowSuffix] = React.useState(false);

  const [keyboardType, setKeyboardType] = React.useState<TextFieldKeyboardType>('text');
  const [imeAction, setImeAction] = React.useState<TextFieldImeAction>('default');
  const [capitalization, setCapitalization] = React.useState<TextFieldCapitalization>('none');

  const TextFieldComponent = outlined ? OutlinedTextField : TextField;

  const sharedProps = {
    ref: textRef,
    value: fieldValue,
    enabled,
    readOnly,
    isError,
    singleLine,
    maxLines: singleLine ? undefined : 5,
    keyboardOptions: { keyboardType, imeAction, capitalization, autoCorrectEnabled },
    keyboardActions: {
      onDone: (v: string) => setLastAction(`done: ${v}`),
      onGo: (v: string) => setLastAction(`go: ${v}`),
      onSearch: (v: string) => setLastAction(`search: ${v}`),
      onSend: (v: string) => setLastAction(`send: ${v}`),
      onNext: (v: string) => setLastAction(`next: ${v}`),
      onPrevious: (v: string) => setLastAction(`previous: ${v}`),
    },
    onValueChange: setTextValue,
    onFocusChanged: setFocusedState,
  };

  const p = padding(16, 12, 16, 12);
  const cardModifiers = [fillMaxWidth()];

  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn
        verticalArrangement={{ spacedBy: 8 }}
        modifiers={[padding(12, 8, 12, 8), fillMaxWidth()]}>
        {/* TextField */}
        <Card modifiers={cardModifiers}>
          <Column modifiers={[p]} verticalArrangement={{ spacedBy: 8 }}>
            <TextFieldComponent {...sharedProps} modifiers={[fillMaxWidth()]}>
              {showLabel && (
                <TextFieldComponent.Label>
                  <ComposeText>Label</ComposeText>
                </TextFieldComponent.Label>
              )}
              {showPlaceholder && (
                <TextFieldComponent.Placeholder>
                  <ComposeText>Placeholder text</ComposeText>
                </TextFieldComponent.Placeholder>
              )}
              {showLeadingIcon && (
                <TextFieldComponent.LeadingIcon>
                  <ComposeText>🔍</ComposeText>
                </TextFieldComponent.LeadingIcon>
              )}
              {showTrailingIcon && (
                <TextFieldComponent.TrailingIcon>
                  <ComposeText>✕</ComposeText>
                </TextFieldComponent.TrailingIcon>
              )}
              {showPrefix && (
                <TextFieldComponent.Prefix>
                  <ComposeText>$</ComposeText>
                </TextFieldComponent.Prefix>
              )}
              {showSuffix && (
                <TextFieldComponent.Suffix>
                  <ComposeText>.00</ComposeText>
                </TextFieldComponent.Suffix>
              )}
              {showSupportingText && (
                <TextFieldComponent.SupportingText>
                  <ComposeText>{isError ? 'Error: invalid input' : 'Helper text'}</ComposeText>
                </TextFieldComponent.SupportingText>
              )}
            </TextFieldComponent>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              <Button onClick={() => textRef.current?.setText('Reset!')}>
                <ComposeText>setText</ComposeText>
              </Button>
              <Button onClick={() => textRef.current?.focus()}>
                <ComposeText>focus</ComposeText>
              </Button>
              <Button onClick={() => textRef.current?.blur()}>
                <ComposeText>blur</ComposeText>
              </Button>
            </Row>
            <ComposeText style={{ typography: 'bodySmall' }}>
              Value: {JSON.stringify(textValue)} | Focused: {String(focusedState)} | Action:{' '}
              {lastAction || 'none'}
            </ComposeText>
          </Column>
        </Card>

        {/* Worklet phone masking */}
        <Card modifiers={cardModifiers}>
          <Column modifiers={[p]} verticalArrangement={{ spacedBy: 8 }}>
            <ComposeText style={{ typography: 'labelLarge' }}>Worklet Phone Masking</ComposeText>
            <TextField
              value={maskedPhone}
              keyboardOptions={{ keyboardType: 'phone' }}
              modifiers={[fillMaxWidth()]}
              onValueChange={(v) => {
                'worklet';
                const digits = v.text.replace(/\D/g, '').slice(0, 10);
                let formatted: string;
                if (digits.length === 0) {
                  formatted = '';
                } else if (digits.length <= 3) {
                  formatted = digits;
                } else if (digits.length <= 6) {
                  formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
                } else {
                  formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                }
                if (formatted !== v.text) {
                  maskedPhone.value = {
                    text: formatted,
                    selection: { start: formatted.length, end: formatted.length },
                  };
                }
              }}>
              <TextField.Placeholder>
                <ComposeText>(555) 123-4567</ComposeText>
              </TextField.Placeholder>
            </TextField>
            <ComposeText style={{ typography: 'bodySmall' }}>
              Formats on the UI thread — no flicker between typed and masked value.
            </ComposeText>
          </Column>
        </Card>

        {/* Props */}
        <Card modifiers={cardModifiers}>
          <Column modifiers={[p]} verticalArrangement={{ spacedBy: 2 }}>
            <ComposeText style={{ typography: 'labelLarge' }}>Props</ComposeText>
            <SwitchRow label="Outlined" value={outlined} onCheckedChange={setOutlined} />
            <SwitchRow label="Enabled" value={enabled} onCheckedChange={setEnabled} />
            <SwitchRow label="Read Only" value={readOnly} onCheckedChange={setReadOnly} />
            <SwitchRow label="Is Error" value={isError} onCheckedChange={setIsError} />
            <SwitchRow label="Single Line" value={singleLine} onCheckedChange={setSingleLine} />
            <SwitchRow
              label="Auto Correct"
              value={autoCorrectEnabled}
              onCheckedChange={setAutoCorrectEnabled}
            />
          </Column>
        </Card>

        {/* Slots */}
        <Card modifiers={cardModifiers}>
          <Column modifiers={[p]} verticalArrangement={{ spacedBy: 2 }}>
            <ComposeText style={{ typography: 'labelLarge' }}>Slots</ComposeText>
            <SwitchRow label="Label" value={showLabel} onCheckedChange={setShowLabel} />
            <SwitchRow
              label="Placeholder"
              value={showPlaceholder}
              onCheckedChange={setShowPlaceholder}
            />
            <SwitchRow
              label="Leading Icon"
              value={showLeadingIcon}
              onCheckedChange={setShowLeadingIcon}
            />
            <SwitchRow
              label="Trailing Icon"
              value={showTrailingIcon}
              onCheckedChange={setShowTrailingIcon}
            />
            <SwitchRow label="Prefix" value={showPrefix} onCheckedChange={setShowPrefix} />
            <SwitchRow label="Suffix" value={showSuffix} onCheckedChange={setShowSuffix} />
            <SwitchRow
              label="Supporting Text"
              value={showSupportingText}
              onCheckedChange={setShowSupportingText}
            />
          </Column>
        </Card>

        {/* Keyboard Options */}
        <Card modifiers={cardModifiers}>
          <Column modifiers={[p]} verticalArrangement={{ spacedBy: 8 }}>
            <ComposeText style={{ typography: 'labelLarge' }}>Keyboard Type</ComposeText>
            <ChipGroup
              options={['text', 'number', 'email', 'phone', 'decimal', 'password', 'ascii', 'uri']}
              selected={keyboardType}
              onSelect={setKeyboardType}
            />
            <ComposeText style={{ typography: 'labelLarge' }}>IME Action</ComposeText>
            <ChipGroup
              options={['default', 'done', 'go', 'search', 'send', 'next', 'previous']}
              selected={imeAction}
              onSelect={setImeAction}
            />
            <ComposeText style={{ typography: 'labelLarge' }}>Capitalization</ComposeText>
            <ChipGroup
              options={['none', 'characters', 'words', 'sentences']}
              selected={capitalization}
              onSelect={setCapitalization}
            />
          </Column>
        </Card>
      </LazyColumn>
    </Host>
  );
}

function SwitchRow({
  label,
  value,
  onCheckedChange,
}: {
  label: string;
  value: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
      <ComposeText modifiers={[weight(1)]}>{label}</ComposeText>
      <Switch value={value} onCheckedChange={onCheckedChange} />
    </Row>
  );
}

function ChipGroup<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <FlowRow horizontalArrangement={{ spacedBy: 6 }} verticalArrangement={{ spacedBy: 4 }}>
      {options.map((opt) => (
        <FilterChip key={opt} selected={opt === selected} onClick={() => onSelect(opt)}>
          <FilterChip.Label>
            <ComposeText>{opt}</ComposeText>
          </FilterChip.Label>
        </FilterChip>
      ))}
    </FlowRow>
  );
}

TextFieldScreen.navigationOptions = {
  title: 'TextField',
};
