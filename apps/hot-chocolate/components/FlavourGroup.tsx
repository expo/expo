import { DisclosureGroup, HStack, Image, Text, VStack } from '@expo/ui/swift-ui-primitives';
import { useState } from 'react';

import { type Flavour } from '@/model';

export default function FlavourGroup({ flavour }: { flavour: Flavour }) {
  function formatDate(isoDate: string) {
    return new Date(isoDate).toLocaleDateString();
  }

  const [isFavourite, setIsFavourite] = useState(false);
  const [isTasted, setIsTasted] = useState(false);

  const label = `#${flavour.id} - ${flavour.name}`;
  const date = `${formatDate(flavour.startDate)} to ${formatDate(flavour.endDate)}`;

  return (
    <DisclosureGroup label={label}>
      <VStack spacing={8} alignment="leading">
        <HStack spacing={8}>
          <Text size={24} weight="bold">
            {label}
          </Text>
          <Image
            systemName={isFavourite ? 'star.fill' : 'star'}
            size={18}
            color={isFavourite ? '#FFD700' : 'secondary'}
            onPress={() => setIsFavourite(!isFavourite)}
          />
          <Image
            systemName={isTasted ? 'checkmark.seal.fill' : 'checkmark.seal'}
            size={18}
            color={isTasted ? '#007AFF' : 'secondary'}
            onPress={() => setIsTasted(!isTasted)}
          />
        </HStack>
        <Text size={14} color="secondary">
          {date}
        </Text>
        <Text size={16}>{flavour.description}</Text>
      </VStack>
    </DisclosureGroup>
  );
}
