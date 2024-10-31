import { mergeClasses } from '@expo/styleguide';
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
  type?: ReactNode;
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
    <div className="mb-2 mt-1">
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
    marginLeft: property.nested ? spacing[6] * property.nested : 0,
  };

  return (
    <TableCell fitContent>
      <P
        className={mergeClasses(
          'block',
          property.nested && 'list-item',
          (property.nested ?? 0) % 2 ? 'list-disc' : 'list-[circle]'
        )}
        style={style}>
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
    <P className="mt-1">
      {property.rules?.map(rule => (
        <FOOTNOTE
          key={`${id}-${property.name}-${rule}`}
          tag="span"
          theme="secondary"
          className="block whitespace-nowrap">
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
          <CODE className="my-1">{category}</CODE>{' '}
        </Fragment>
      ))}
    </>
  );
}
