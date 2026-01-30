import { useLocalSearchParams, usePathname } from 'expo-router';

import { Table, TableRow } from '../components/Table';
import { SiteLinks, SiteLink } from '../components/SiteLink';

export default function NoLoaderRoute() {
  return (<NoLoaderScreen />)
}

const NoLoaderScreen = () => {
  const pathname = usePathname();
  const localParams = useLocalSearchParams();

  return (
    <>
      <Table>
        <TableRow label="Pathname" value={pathname} testID="pathname-result" />
        <TableRow label="Local Params" value={localParams} testID="localparams-result" />
      </Table>

      <SiteLinks>
        <SiteLink href="/">Go to Index</SiteLink>
      </SiteLinks>
    </>
  );
}


