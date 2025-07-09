import { Button } from '@expo/styleguide';
import { useState } from 'react';

import { Talk } from '~/public/static/talks';
import { TalkGridWrapper, TalkGridCell } from '~/ui/components/Home/sections';

type CollapsibleGridProps = {
  items: Talk[];
  initialCount?: number;
};

export function CollapsibleTalksGridWrapper({ items }: CollapsibleGridProps) {
  const [showAll, setShowAll] = useState(false);
  const initialRowCount = 3;
  const itemsPerRow = 4;
  const initialItems = initialRowCount * itemsPerRow;

  return (
    <>
      <TalkGridWrapper>
        {items.slice(0, showAll ? items.length : initialItems).map(item => (
          <TalkGridCell key={item.videoId ?? item.event} {...item} />
        ))}
      </TalkGridWrapper>

      {items.length > initialItems && (
        <div className="mt-6 flex justify-center">
          <Button
            theme="secondary"
            onClick={() => {
              setShowAll(!showAll);
            }}>
            {showAll ? 'Show Less' : 'Show More'}
          </Button>
        </div>
      )}
    </>
  );
}
