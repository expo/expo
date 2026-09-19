import {
  Button,
  ContentUnavailableView,
  Host,
  HStack,
  Image,
  Label,
  List,
  NavigationDestination,
  NavigationLink,
  NavigationSplitView,
  type NavigationSplitViewColumn,
  NavigationStack,
  ScrollView,
  Section,
  Spacer,
  Text,
  Toolbar,
  ToolbarItem,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  font,
  foregroundStyle,
  frame,
  navigationTitle,
  padding,
  tag,
} from '@expo/ui/swift-ui/modifiers';
import * as React from 'react';

const HABITATS = [
  {
    title: 'Woodland and gardens',
    birds: [
      {
        name: 'Eurasian Wren',
        latin: 'Troglodytes troglodytes',
        systemImage: 'bird.fill',
        color: '#8E6E53',
        description:
          'A very small brown bird with a short tail it often holds upright. Its song is far louder than its size suggests.',
      },
      {
        name: 'European Robin',
        latin: 'Erithacus rubecula',
        systemImage: 'bird.fill',
        color: '#E4572E',
        description:
          'Orange breast, upright stance, and a habit of following gardeners for turned soil. It holds a territory all year.',
      },
      {
        name: 'Great Tit',
        latin: 'Parus major',
        systemImage: 'bird.fill',
        color: '#F2C14E',
        description:
          'Black head with white cheeks and a black stripe down a yellow belly. A bold and adaptable visitor to feeders.',
      },
      {
        name: 'Eurasian Blackbird',
        latin: 'Turdus merula',
        systemImage: 'bird.fill',
        color: '#2F2F33',
        description:
          'The male is all black with a bright orange bill and eye ring. Its fluting song carries at dusk.',
      },
      {
        name: 'Goldcrest',
        latin: 'Regulus regulus',
        systemImage: 'leaf.fill',
        color: '#5C9E3F',
        description:
          'Europe’s smallest bird, weighing about as much as a twenty pence coin. It favours conifers.',
      },
    ],
  },
  {
    title: 'Farmland and open country',
    birds: [
      {
        name: 'Barn Swallow',
        latin: 'Hirundo rustica',
        systemImage: 'bird',
        color: '#3A6EA5',
        description:
          'Long tail streamers and a dark blue back. It feeds on the wing and nests in barns and outbuildings.',
      },
      {
        name: 'Eurasian Skylark',
        latin: 'Alauda arvensis',
        systemImage: 'sun.max.fill',
        color: '#C9A227',
        description:
          'Sings while hovering high overhead, often for minutes at a time, then drops back to the field.',
      },
      {
        name: 'Yellowhammer',
        latin: 'Emberiza citrinella',
        systemImage: 'bird.fill',
        color: '#E8C547',
        description:
          'A bright yellow head and a song traditionally written out as “a little bit of bread and no cheese”.',
      },
      {
        name: 'Common Kestrel',
        latin: 'Falco tinnunculus',
        systemImage: 'wind',
        color: '#A0522D',
        description:
          'Hovers with its head held perfectly still while it scans the verge below for voles.',
      },
    ],
  },
  {
    title: 'Coast and wetland',
    birds: [
      {
        name: 'Common Kingfisher',
        latin: 'Alcedo atthis',
        systemImage: 'drop.fill',
        color: '#2FA8CC',
        description:
          'Electric blue above and orange below. Usually seen as a flash of colour low over the water.',
      },
      {
        name: 'Grey Heron',
        latin: 'Ardea cinerea',
        systemImage: 'water.waves',
        color: '#7D8A99',
        description:
          'Stands motionless at the water’s edge for long spells, then strikes at fish with its dagger bill.',
      },
      {
        name: 'Eurasian Oystercatcher',
        latin: 'Haematopus ostralegus',
        systemImage: 'bird.fill',
        color: '#D1495B',
        description:
          'Pied plumage and a long orange bill used to prise open shellfish. Noisy in flight.',
      },
      {
        name: 'Sandwich Tern',
        latin: 'Thalasseus sandvicensis',
        systemImage: 'bird',
        color: '#4C6EF5',
        description:
          'A pale tern with a shaggy black cap and a yellow bill tip. It plunge dives for small fish.',
      },
    ],
  },
] as const;

type Bird = (typeof HABITATS)[number]['birds'][number];
type Selection = Bird & { habitat: string };

const TOTAL_BIRDS = HABITATS.reduce((total, habitat) => total + habitat.birds.length, 0);

/**
 * A two column layout of the kind iPhone Duo is built around.
 *
 * Folded, the outer display is compact width, so the split view collapses to one column and
 * `preferredCompactColumn` decides which one is on screen. Unfolded, the inner display is regular
 * width and both columns sit side by side, the same way Mail shows the message list and a message
 * together. The same code covers both, which is what the Human Interface Guidelines ask for:
 * adapt by size class rather than by device.
 *
 * The detail toolbar is deliberately busy. On Duo the system moves toolbars to the side and
 * overflows items from the bottom up, so the placements below are what decides which action
 * survives on the narrow outer display.
 */
export default function NavigationStackScreen() {
  const [selected, setSelected] = React.useState<Selection | null>(null);
  const [favourites, setFavourites] = React.useState<string[]>([]);
  const [descending, setDescending] = React.useState(false);
  const [path, setPath] = React.useState<string[]>([]);
  // Controlled in both directions. Setting it without the callback pins the collapsed view to
  // the sidebar forever, because SwiftUI's own write is skipped and never echoed back.
  const [compactColumn, setCompactColumn] = React.useState<NavigationSplitViewColumn>('sidebar');

  const sort = (birds: readonly Bird[]) =>
    [...birds].sort((a, b) =>
      descending ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    );

  const isFavourite = selected ? favourites.includes(selected.name) : false;

  const toggleFavourite = () => {
    if (!selected) {
      return;
    }
    setFavourites((current) =>
      current.includes(selected.name)
        ? current.filter((name) => name !== selected.name)
        : [...current, selected.name]
    );
  };

  return (
    <Host style={{ flex: 1 }}>
      <NavigationSplitView
        preferredCompactColumn={compactColumn}
        onPreferredCompactColumnChange={setCompactColumn}>
        <NavigationSplitView.Sidebar>
          <NavigationStack path={path} onPathChange={setPath}>
            <Toolbar modifiers={[navigationTitle('Birds')]}>
              {/* Controlled in both directions, for the same reason as `preferredCompactColumn`:
                  a selection prop without its callback leaves the two sides diverged. */}
              <List
                selection={selected ? [selected.name] : []}
                onSelectionChange={(selection) => {
                  const name = selection[0];
                  const bird = HABITATS.flatMap((habitat) =>
                    habitat.birds.map((entry) => ({ ...entry, habitat: habitat.title }))
                  ).find((entry) => entry.name === name);

                  if (bird) {
                    setSelected(bird);
                    setCompactColumn('detail');
                  }
                }}>
                {HABITATS.map((habitat) => (
                  <Section key={habitat.title} title={habitat.title}>
                    {sort(habitat.birds).map((bird) => (
                      <Button
                        key={bird.name}
                        modifiers={[buttonStyle('plain'), tag(bird.name)]}
                        onPress={() => {
                          setSelected({ ...bird, habitat: habitat.title });
                          // A plain state change does not move a collapsed split view. The tap
                          // has to ask for the detail column itself.
                          setCompactColumn('detail');
                        }}>
                        <HStack spacing={12}>
                          <Label
                            icon={
                              <Image
                                systemName={bird.systemImage}
                                size={22}
                                modifiers={[foregroundStyle(bird.color)]}
                              />
                            }>
                            <VStack alignment="leading" spacing={2}>
                              <Text>{bird.name}</Text>
                              <Text
                                modifiers={[
                                  font({ textStyle: 'caption' }),
                                  foregroundStyle('secondaryLabel'),
                                ]}>
                                {bird.latin}
                              </Text>
                            </VStack>
                          </Label>
                          <Spacer />
                          {favourites.includes(bird.name) ? (
                            <Image
                              systemName="star.fill"
                              size={13}
                              modifiers={[foregroundStyle('#E8C547')]}
                            />
                          ) : (
                            <Image
                              systemName="chevron.right"
                              size={13}
                              modifiers={[foregroundStyle('tertiaryLabel')]}
                            />
                          )}
                        </HStack>
                      </Button>
                    ))}
                  </Section>
                ))}
                <Section title="Pushed screen">
                  {/* Appends 'about' to the stack's path, which mounts the destination below. */}
                  <NavigationLink value="about">
                    <Text>About this list</Text>
                  </NavigationLink>
                </Section>
              </List>

              <Toolbar.Content>
                <ToolbarItem placement="topBarTrailing">
                  <Button
                    systemImage="arrow.up.arrow.down"
                    label={descending ? 'Sort Z to A' : 'Sort A to Z'}
                    onPress={() => setDescending((value) => !value)}
                  />
                </ToolbarItem>
                <ToolbarItem placement="bottomBar">
                  <Text modifiers={[foregroundStyle('secondaryLabel')]}>
                    {`${TOTAL_BIRDS} birds`}
                  </Text>
                </ToolbarItem>
              </Toolbar.Content>
            </Toolbar>

            <NavigationDestination value="about">
              <VStack
                alignment="leading"
                spacing={12}
                modifiers={[padding({ all: 20 }), navigationTitle('About')]}>
                <Text modifiers={[font({ textStyle: 'headline' })]}>British garden birds</Text>
                <Text>
                  Each habitat lists the species you are most likely to see there. Pick a bird to
                  read about it in the second column.
                </Text>
                <Spacer />
              </VStack>
            </NavigationDestination>
          </NavigationStack>
        </NavigationSplitView.Sidebar>

        <NavigationSplitView.Detail>
          <NavigationStack>
            <Toolbar modifiers={[navigationTitle(selected?.name ?? '')]}>
              {selected ? (
                <ScrollView>
                  <VStack alignment="leading" spacing={16} modifiers={[padding({ all: 20 })]}>
                    <HStack spacing={12}>
                      <Image
                        systemName={selected.systemImage}
                        size={34}
                        modifiers={[foregroundStyle(selected.color)]}
                      />
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[font({ textStyle: 'headline' })]}>{selected.name}</Text>
                        <Text
                          modifiers={[
                            font({ textStyle: 'subheadline' }),
                            foregroundStyle('secondaryLabel'),
                          ]}>
                          {selected.latin}
                        </Text>
                      </VStack>
                    </HStack>

                    <Label
                      title={selected.habitat}
                      systemImage="mappin.and.ellipse"
                      modifiers={[
                        font({ textStyle: 'subheadline' }),
                        foregroundStyle('secondaryLabel'),
                      ]}
                    />

                    <Text modifiers={[frame({ maxWidth: 680, alignment: 'leading' })]}>
                      {selected.description}
                    </Text>
                    <Spacer />
                  </VStack>
                </ScrollView>
              ) : (
                <ContentUnavailableView
                  title="No bird selected"
                  systemImage="bird"
                  description="Pick a species from the list to read about it."
                />
              )}

              <Toolbar.Content>
                {/* Pinned and high priority, so it is the last thing to overflow on Duo. */}
                <ToolbarItem placement="topBarPinnedTrailing" visibilityPriority="high">
                  <Button
                    systemImage={isFavourite ? 'star.fill' : 'star'}
                    label={isFavourite ? 'Remove favourite' : 'Add favourite'}
                    onPress={toggleFavourite}
                  />
                </ToolbarItem>
                <ToolbarItem placement="primaryAction">
                  <Button systemImage="square.and.arrow.up" label="Share" onPress={() => {}} />
                </ToolbarItem>
                {/* Lowered, so these two give up their place before anything else. */}
                <ToolbarItem placement="secondaryAction" visibilityPriority="low">
                  <Button systemImage="map" label="Show range" onPress={() => {}} />
                </ToolbarItem>
                <ToolbarItem placement="secondaryAction" visibilityPriority="low">
                  <Button systemImage="speaker.wave.2" label="Play call" onPress={() => {}} />
                </ToolbarItem>
                <ToolbarItem placement="bottomBar">
                  <Button systemImage="plus.circle" label="Log sighting" onPress={() => {}} />
                </ToolbarItem>
              </Toolbar.Content>
            </Toolbar>
          </NavigationStack>
        </NavigationSplitView.Detail>
      </NavigationSplitView>
    </Host>
  );
}

NavigationStackScreen.navigationOptions = {
  title: 'NavigationStack',
};
