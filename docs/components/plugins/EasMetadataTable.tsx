import { css } from '@emotion/react';
import { spacing } from '@expo/styleguide-base';
import assert from 'assert';
import { ComponentType, Fragment, ReactNode, useId } from 'react';

import { Table, Row as TableRow, Cell as TableCell } from '~/ui/components/Table';
import { CODE, P, FOOTNOTE } from '~/ui/components/Text';

interface MetadataTableProps {
  headers: MetadataHeader[];
  children: MetadataProperty[];
}

type MetadataHeader = 'Description' | 'Language Code' | 'Language' | 'Name' | 'Property' | 'Type';

interface MetadataProperty {
  name: string;
  nested?: number;
  type?: string | ReactNode;
  description?: string | ReactNode[];
  rules?: string[];
}

interface MetadataPropertyProps {
  property: MetadataProperty;
}

export function MetadataTable(props: MetadataTableProps) {
  const id = useId();
  const { headers = ['Property', 'Type', 'Description'], children = [] } = props;

  return (
    <div css={$container}>
      <Table headers={headers}>
        {children.map(property => (
          <TableRow key={`${id}-${property.name}`}>
            {headers.map(column => {
              const Property = metadataProperties[column];
              assert(Property, `No metadata property renderer found for ${column}`);
              return <Property key={`${id}-${property.name}-${column}`} property={property} />;
            })}
          </TableRow>
        ))}
      </Table>
    </div>
  );
}

const metadataProperties: Record<MetadataHeader, ComponentType<MetadataPropertyProps>> = {
  Description: MetadataDescriptionCell,
  Language: MetadataLanguageNameCell,
  'Language Code': MetadataLanguageCodeCell,
  Name: MetadataNameCell,
  Property: MetadataNameCell,
  Type: MetadataTypeCell,
};

function MetadataNameCell({ property }: MetadataPropertyProps) {
  const style = {
    display: property.nested ? 'list-item' : 'block',
    marginLeft: property.nested ? spacing[6] * property.nested : 0,
    listStyleType: (property.nested ?? 0) % 2 ? 'default' : 'circle',
  };

  return (
    <TableCell fitContent>
      <P css={style}>
        <CODE>{property.name}</CODE>
      </P>
    </TableCell>
  );
}

function MetadataTypeCell({ property }: MetadataPropertyProps) {
  return (
    <TableCell fitContent>
      <P>
        <CODE>{property.type}</CODE>
      </P>
      <MetadataPropertyTypeRules property={property} />
    </TableCell>
  );
}

function MetadataPropertyTypeRules({ property }: MetadataPropertyProps) {
  const id = useId();

  return (
    <P css={{ marginTop: spacing[1] }}>
      {property.rules?.map(rule => (
        <FOOTNOTE
          key={`${id}-${property.name}-${rule}`}
          tag="span"
          theme="secondary"
          css={{ display: 'block', whiteSpace: 'nowrap' }}>
          {rule}
        </FOOTNOTE>
      ))}
    </P>
  );
}

function MetadataDescriptionCell({ property }: MetadataPropertyProps) {
  return (
    <TableCell>
      {typeof property.description === 'string' ? (
        <P>{property.description}</P>
      ) : (
        property.description?.map((item, i) => (
          <Fragment key={`${property.name}-${i}`}>{item}</Fragment>
        ))
      )}
    </TableCell>
  );
}

function MetadataLanguageNameCell({ property }: MetadataPropertyProps) {
  return (
    <TableCell fitContent>
      <P>{property.name}</P>
    </TableCell>
  );
}

function MetadataLanguageCodeCell({ property }: MetadataPropertyProps) {
  return (
    <TableCell fitContent>
      {typeof property.description === 'string' ? (
        <P>
          <CODE>{property.description}</CODE>
        </P>
      ) : (
        property.description?.map((item, i) => (
          <Fragment key={`${property.name}-${i}`}>{item}</Fragment>
        ))
      )}
    </TableCell>
  );
}
export function MetadataSubcategories({ children }: { children: string[] }) {
  const id = useId();

  return (
    <>
      {children.map(category => (
        <Fragment key={`${id}-${category}`}>
          <CODE css={$subcategoryName}>{category}</CODE>{' '}
        </Fragment>
      ))}
    </>
  );
}

const $container = css({
  marginBottom: '1ch',
  marginTop: '0.5ch',
});

const $subcategoryName = {
  marginTop: spacing[0.5],
  marginBottom: spacing[0.5],
};
