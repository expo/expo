import {
  BottomSheet,
  Button,
  Host,
  HStack,
  Image,
  Label,
  List,
  NavigationStack,
  Section,
  Spacer,
  Text,
  Toolbar,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  font,
  foregroundStyle,
  navigationTitle,
  padding,
  presentationDetents,
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

export default function NavigationStackScreen() {
  const [selected, setSelected] = React.useState<Selection | null>(null);
  const [isPresented, setIsPresented] = React.useState(false);
  const [descending, setDescending] = React.useState(false);

  const sort = (birds: readonly Bird[]) =>
    [...birds].sort((a, b) =>
      descending ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
    );

  return (
    <Host style={{ flex: 1 }}>
      <NavigationStack>
        {/* The title and the sort button both belong to the bar this stack provides. */}
        <Toolbar modifiers={[navigationTitle('Birds')]}>
          <BottomSheet
            isPresented={isPresented}
            onIsPresentedChange={setIsPresented}
            // Cleared only once the sheet is fully gone, so its content does not
            // blank out mid dismiss.
            onDismiss={() => setSelected(null)}
            anchor={
              <List>
                {HABITATS.map((habitat) => (
                  <Section key={habitat.title} title={habitat.title}>
                    {sort(habitat.birds).map((bird) => (
                      <Button
                        key={bird.name}
                        modifiers={[buttonStyle('plain')]}
                        onPress={() => {
                          setSelected({ ...bird, habitat: habitat.title });
                          setIsPresented(true);
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
                          <Image
                            systemName="chevron.right"
                            size={13}
                            modifiers={[foregroundStyle('tertiaryLabel')]}
                          />
                        </HStack>
                      </Button>
                    ))}
                  </Section>
                ))}
              </List>
            }>
            {/* A sheet has no navigation bar of its own. The stack adds one, which gives the
                `close` button somewhere to sit. iOS 26 draws that button as an xmark. */}
            <NavigationStack modifiers={[presentationDetents(['medium', 'large'])]}>
              <Toolbar modifiers={[navigationTitle(selected?.name ?? '')]}>
                <VStack alignment="leading" spacing={16} modifiers={[padding({ all: 20 })]}>
                  <HStack spacing={12}>
                    <Image
                      systemName={selected?.systemImage ?? 'bird.fill'}
                      size={34}
                      modifiers={[foregroundStyle(selected?.color ?? 'label')]}
                    />
                    <VStack alignment="leading" spacing={2}>
                      <Text modifiers={[font({ textStyle: 'headline' })]}>
                        {selected?.name ?? ''}
                      </Text>
                      <Text
                        modifiers={[
                          font({ textStyle: 'subheadline' }),
                          foregroundStyle('secondaryLabel'),
                        ]}>
                        {selected?.latin ?? ''}
                      </Text>
                    </VStack>
                  </HStack>

                  <Label
                    title={selected?.habitat ?? ''}
                    systemImage="mappin.and.ellipse"
                    modifiers={[
                      font({ textStyle: 'subheadline' }),
                      foregroundStyle('secondaryLabel'),
                    ]}
                  />

                  <Text>{selected?.description ?? ''}</Text>
                  <Spacer />
                </VStack>

                <Toolbar.Content>
                  <Button role="close" onPress={() => setIsPresented(false)} />
                </Toolbar.Content>
              </Toolbar>
            </NavigationStack>
          </BottomSheet>

          <Toolbar.Content>
            <Button
              systemImage="arrow.up.arrow.down"
              label={descending ? 'Sort Z to A' : 'Sort A to Z'}
              onPress={() => setDescending((value) => !value)}
            />
          </Toolbar.Content>
        </Toolbar>
      </NavigationStack>
    </Host>
  );
}

NavigationStackScreen.navigationOptions = {
  title: 'NavigationStack',
};
