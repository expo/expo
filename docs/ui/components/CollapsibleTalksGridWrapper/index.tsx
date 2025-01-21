import { Button } from '@expo/styleguide';
import { ArrowDownIcon } from '@expo/styleguide-icons/outline/ArrowDownIcon';
import { useState } from 'react';

import { Talk } from '~/public/static/talks';
import { TalkGridWrapper, TalkGridCell } from '~/ui/components/Home/sections';

type CollapsibleGridProps = {
  items: Talk[];
  initialCount?: number;
};

export function CollapsibleTalksGridWrapper({ items, initialCount = 8 }: CollapsibleGridProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <>
      <TalkGridWrapper>
        {items.slice(0, showAll ? items.length : initialCount).map(item => (
          <TalkGridCell key={item.videoId ?? item.event} {...item} />
        ))}
      </TalkGridWrapper>

      {items.length > initialCount && !showAll && (
        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            theme="secondary"
            onClick={() => {
              setShowAll(true);
            }}
            rightSlot={<ArrowDownIcon className="icon-sm" />}>
            Show More
          </Button>
        </div>
      )}
    </>
  );
}
