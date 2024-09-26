import { StatusWaitingIcon } from '@expo/styleguide-icons/custom/StatusWaitingIcon';

import { ElementType } from '~/types/common';
import { NoIcon, YesIcon } from '~/ui/components/DocIcons';
import { Cell, HeaderCell, Row, Table, TableHead } from '~/ui/components/Table';
import { A, H4 } from '~/ui/components/Text';

const platforms = [
  { title: 'Android Device', propName: 'android' },
  { title: 'Android Emulator', propName: 'emulator' },
  { title: 'iOS Device', propName: 'ios' },
  { title: 'iOS Simulator', propName: 'simulator' },
  { title: 'Web', propName: 'web' },
];

type Platform = ElementType<typeof platforms>;
type IsSupported = boolean | undefined | { pending: string };

function getInfo(isSupported: IsSupported, { title }: Platform) {
  if (isSupported === true) {
    return {
      children: <YesIcon />,
      title: `${title} is supported`,
    };
  } else if (typeof isSupported === 'object') {
    return {
      children: (
        <A className="grid gap-2 grid-cols-[20px_auto]" href={isSupported.pending}>
          <StatusWaitingIcon className="icon-md text-icon-info" /> Pending
        </A>
      ),
      title: `${title} support is pending`,
    };
  }

  return {
    children: <NoIcon />,
    title: `${title} is not supported`,
  };
}

type Props = {
  title?: string;
  ios?: boolean;
  android?: boolean;
  web?: boolean;
  simulator?: boolean;
  emulator?: boolean;
};

type PlatformProps = Omit<Props, 'title'>;

const PlatformsSection = (props: Props) => (
  <>
    <H4 className="mb-1">{props.title || 'Platform Compatibility'}</H4>
    <Table className="table-fixed max-sm-gutters:table-auto">
      <TableHead>
        <Row>
          {platforms.map(({ title }) => (
            <HeaderCell key={title}>{title}</HeaderCell>
          ))}
        </Row>
      </TableHead>
      <tbody>
        <Row>
          {platforms.map(platform => (
            <Cell
              key={platform.title}
              {...getInfo(props[platform.propName as keyof PlatformProps], platform)}
            />
          ))}
        </Row>
      </tbody>
    </Table>
  </>
);

export default PlatformsSection;
