import React from 'react';

import { Link, LinkProps } from '~/ui/components/Link';

type TocLinkProps = LinkProps;

export const TocLink = ({ ...rest }: TocLinkProps) => (
  <Link {...rest} />
);
