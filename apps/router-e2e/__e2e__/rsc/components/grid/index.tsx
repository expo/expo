import { LI, UL } from '@expo/html-elements';
import clsx from 'clsx';

function Grid(props: React.ComponentProps<'ul'>) {
  return (
    <UL {...props} className={clsx('grid grid-flow-row gap-4', props.className)}>
      {props.children}
    </UL>
  );
}

function GridItem(props: React.ComponentProps<'li'>) {
  return (
    <LI {...props} className={clsx('aspect-square transition-opacity', props.className)}>
      {props.children}
    </LI>
  );
}

Grid.Item = GridItem;

export default Grid;
