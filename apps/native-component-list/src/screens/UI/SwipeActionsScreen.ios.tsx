import { Button, Form, Host, Image, Section, SwipeActions, Text, Toggle } from '@expo/ui/swift-ui';
import { tint } from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { Alert } from 'react-native';

type SwipeActionRow = {
  id: string;
  title: string;
  allowsFullSwipe: boolean;
  iconOnlyActions: boolean;
};

type SwipeActionSymbol =
  | 'archivebox.fill'
  | 'bell.slash.fill'
  | 'ellipsis.circle.fill'
  | 'envelope.open.fill'
  | 'flag.fill'
  | 'pin.fill'
  | 'trash.fill';

const initialRows: SwipeActionRow[] = [
  {
    id: '1',
    title: 'Full swipe enabled',
    allowsFullSwipe: true,
    iconOnlyActions: false,
  },
  {
    id: '2',
    title: 'Full swipe disabled',
    allowsFullSwipe: false,
    iconOnlyActions: false,
  },
  {
    id: '3',
    title: 'Icon only full swipe enabled',
    allowsFullSwipe: true,
    iconOnlyActions: true,
  },
  {
    id: '4',
    title: 'Icon only full swipe disabled',
    allowsFullSwipe: false,
    iconOnlyActions: true,
  },
];

const extraRows: SwipeActionRow[] = [
  {
    id: '5',
    title: 'Pinned conversation',
    allowsFullSwipe: true,
    iconOnlyActions: false,
  },
  {
    id: '6',
    title: 'Muted thread',
    allowsFullSwipe: true,
    iconOnlyActions: false,
  },
];

const colors = {
  destructive: '#FF3B30',
  primary: '#007AFF',
  success: '#34C759',
  secondary: '#8E8E93',
  warning: '#FF9500',
};

export default function SwipeActionsScreen() {
  const [rows, setRows] = useState(initialRows);
  const [formRevision, setFormRevision] = useState(0);
  const [forceIconOnly, setForceIconOnly] = useState(false);
  const [forceFullSwipe, setForceFullSwipe] = useState(false);
  const [showLeadingActions, setShowLeadingActions] = useState(true);

  const showActionAlert = (
    action: 'Archive' | 'Delete' | 'Flag' | 'More' | 'Mute' | 'Pin' | 'Read',
    title: string,
    detail?: string
  ) => {
    Alert.alert(`${action} Action`, `${action} selected for "${title}". ${detail ?? ''}`.trim());
  };

  const resetRows = () => {
    setRows(initialRows);
    setFormRevision((revision) => revision + 1);
  };

  const addRows = () => {
    setRows((prev) => {
      const missingRows = extraRows.filter((row) => !prev.some((item) => item.id === row.id));
      return [...prev, ...missingRows];
    });
    setFormRevision((revision) => revision + 1);
  };

  const deleteRow = (row: SwipeActionRow) => {
    setRows((prev) => prev.filter((item) => item.id !== row.id));
    setFormRevision((revision) => revision + 1);
    showActionAlert('Delete', row.title, 'The row was removed from the demo.');
  };

  const archiveRow = (row: SwipeActionRow) => {
    setRows((prev) => prev.filter((item) => item.id !== row.id));
    setFormRevision((revision) => revision + 1);
    showActionAlert('Archive', row.title, 'The row was removed from the demo.');
  };

  const actionButton = ({
    id,
    label,
    systemImage,
    backgroundColor,
    role,
    onPress,
    iconOnly,
  }: {
    id: string;
    label: string;
    systemImage: SwipeActionSymbol;
    backgroundColor: string;
    role?: 'default' | 'destructive' | 'cancel';
    onPress: () => void;
    iconOnly: boolean;
  }) => (
    <Button
      key={id}
      label={iconOnly ? undefined : label}
      systemImage={iconOnly ? undefined : systemImage}
      role={role}
      onPress={onPress}
      modifiers={[tint(backgroundColor)]}>
      {iconOnly ? <Image systemName={systemImage} /> : undefined}
    </Button>
  );

  const iconOnlyForRow = (row: SwipeActionRow) => forceIconOnly || row.iconOnlyActions;
  const allowsFullSwipeForRow = (row: SwipeActionRow) => forceFullSwipe || row.allowsFullSwipe;

  const trailingActionsForRow = (row: SwipeActionRow) => {
    const iconOnly = iconOnlyForRow(row);

    return [
      actionButton({
        id: 'delete',
        label: 'Delete',
        systemImage: 'trash.fill',
        backgroundColor: colors.destructive,
        role: 'destructive',
        onPress: () => deleteRow(row),
        iconOnly,
      }),
      actionButton({
        id: 'more',
        label: 'More',
        systemImage: 'ellipsis.circle.fill',
        backgroundColor: colors.primary,
        onPress: () => showActionAlert('More', row.title),
        iconOnly,
      }),
    ];
  };

  const leadingActionsForRow = (row: SwipeActionRow) => {
    const iconOnly = iconOnlyForRow(row);

    return [
      actionButton({
        id: 'read',
        label: 'Read',
        systemImage: 'envelope.open.fill',
        backgroundColor: colors.success,
        onPress: () => showActionAlert('Read', row.title),
        iconOnly,
      }),
      actionButton({
        id: 'flag',
        label: 'Flag',
        systemImage: 'flag.fill',
        backgroundColor: colors.secondary,
        onPress: () => showActionAlert('Flag', row.title),
        iconOnly,
      }),
    ];
  };

  const utilityActionsForRow = (row: SwipeActionRow) => {
    const iconOnly = iconOnlyForRow(row);

    return [
      actionButton({
        id: 'archive',
        label: 'Archive',
        systemImage: 'archivebox.fill',
        backgroundColor: colors.secondary,
        onPress: () => archiveRow(row),
        iconOnly,
      }),
      actionButton({
        id: 'mute',
        label: 'Mute',
        systemImage: 'bell.slash.fill',
        backgroundColor: colors.warning,
        onPress: () => showActionAlert('Mute', row.title),
        iconOnly,
      }),
      actionButton({
        id: 'pin',
        label: 'Pin',
        systemImage: 'pin.fill',
        backgroundColor: colors.primary,
        onPress: () => showActionAlert('Pin', row.title),
        iconOnly,
      }),
    ];
  };

  const rowContent = (row: SwipeActionRow) => <Text>{row.title}</Text>;

  return (
    <Host style={{ flex: 1 }}>
      <Form key={formRevision}>
        <Section title="Controls">
          <Toggle
            label="Force icon-only actions"
            isOn={forceIconOnly}
            onIsOnChange={setForceIconOnly}
          />
          <Toggle label="Force full swipe" isOn={forceFullSwipe} onIsOnChange={setForceFullSwipe} />
          <Toggle
            label="Show leading actions"
            isOn={showLeadingActions}
            onIsOnChange={setShowLeadingActions}
          />
          <Button label="Reset Rows" onPress={resetRows} />
          <Button label="Add More Rows" onPress={addRows} />
        </Section>

        <Section
          title="Leading and Trailing"
          footer={<Text>{rows.length} rows. Delete removes rows and reset restores them.</Text>}>
          {rows.map((row) => (
            <SwipeActions key={row.id}>
              {rowContent(row)}
              {showLeadingActions ? (
                <SwipeActions.Actions edge="leading" allowsFullSwipe={false}>
                  {leadingActionsForRow(row)}
                </SwipeActions.Actions>
              ) : null}
              <SwipeActions.Actions edge="trailing" allowsFullSwipe={allowsFullSwipeForRow(row)}>
                {trailingActionsForRow(row)}
              </SwipeActions.Actions>
            </SwipeActions>
          ))}
        </Section>

        <Section title="Utility Actions">
          {rows.slice(0, 3).map((row) => (
            <SwipeActions key={`utility-${row.id}`}>
              {rowContent(row)}
              <SwipeActions.Actions edge="trailing" allowsFullSwipe>
                {utilityActionsForRow(row)}
              </SwipeActions.Actions>
            </SwipeActions>
          ))}
        </Section>
      </Form>
    </Host>
  );
}

SwipeActionsScreen.navigationOptions = {
  title: 'Swipe Actions',
};
