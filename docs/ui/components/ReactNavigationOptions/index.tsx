import ReactMarkdown from 'react-markdown';

import { mdComponents } from '~/components/plugins/api/APISectionUtils';
import reactNavigationOptionsData from '~/public/data/react-navigation-options.json';
import { Collapsible } from '~/ui/components/Collapsible';
import { Table, Row, Cell } from '~/ui/components/Table';
import { PlatformTag } from '~/ui/components/Tag/PlatformTag';
import { CODE } from '~/ui/components/Text';

type ReactNavigationOption = {
  name: string;
  description: string;
  platform: 'Both' | 'iOS only' | 'Android only';
  category: 'header' | 'other';
};

type ReactNavigationOptionsData = {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  totalOptions: number;
  categories: {
    header: number;
    other: number;
  };
  options: ReactNavigationOption[];
};

type ReactNavigationOptionsProps = {
  category?: string;
  excludeCategories?: string[];
  title?: string;
};

const PlatformCell = ({ option }: { option: ReactNavigationOption }) => {
  if (option.platform === 'iOS only') {
    return <PlatformTag platform="ios" />;
  }
  if (option.platform === 'Android only') {
    return <PlatformTag platform="android" />;
  }
  return (
    <div className="flex gap-1">
      <PlatformTag platform="android" />
      <PlatformTag platform="ios" />
    </div>
  );
};

const OptionRow = ({ option }: { option: ReactNavigationOption }) => {
  return (
    <Row>
      <Cell>
        <CODE className="text-sm font-semibold">{option.name}</CODE>
      </Cell>
      <Cell>
        <PlatformCell option={option} />
      </Cell>
      <Cell>
        <div className="text-sm">
          <ReactMarkdown components={mdComponents}>{option.description}</ReactMarkdown>
        </div>
      </Cell>
    </Row>
  );
};

export const ReactNavigationOptions = ({
  category,
  excludeCategories,
  title,
}: ReactNavigationOptionsProps) => {
  const data = reactNavigationOptionsData as ReactNavigationOptionsData;

  let filteredOptions = data.options;
  if (category) {
    filteredOptions = data.options.filter(option => option.category === category);
  }

  if (excludeCategories && excludeCategories.length > 0) {
    filteredOptions = filteredOptions.filter(
      option => !excludeCategories.includes(option.category)
    );
  }

  const sortedOptions = filteredOptions.sort((a, b) => a.name.localeCompare(b.name));

  if (category && sortedOptions.length === 0) {
    return <div className="text-sm text-secondary">No options found for category: {category}</div>;
  }

  const defaultTitle = category ? 'Header options' : 'Screen options';

  return (
    <div>
      {title && <h3 className="mb-4 text-lg font-semibold">{title}</h3>}
      <Collapsible summary={<span>{title ?? defaultTitle}</span>}>
        <Table
          headers={['Option', 'Platform', 'Description']}
          headersAlign={['left', 'left', 'left']}
          className="text-sm">
          {sortedOptions.map(option => (
            <OptionRow key={option.name} option={option} />
          ))}
        </Table>
      </Collapsible>
    </div>
  );
};
