import sdkData from '~/public/static/data/sdk-versions.json';
import { Table, Row, Cell, TableHead } from '~/ui/components/Table';
import { CODE } from '~/ui/components/Text';

type VersionRangeProps = {
  startVersion: string;
  endVersion: string;
};

const getLatestCompatibility = () => {
  return sdkData.sdkVersions[0];
};

const getVersionsBetween = (startVersion: string, endVersion: string) => {
  const startIndex = sdkData.sdkVersions.findIndex(v => v.sdk === startVersion);
  const endIndex = sdkData.sdkVersions.findIndex(v => v.sdk === endVersion);

  if (startIndex === -1 || endIndex === -1) {
    return [];
  }

  return sdkData.sdkVersions.slice(
    Math.min(startIndex, endIndex),
    Math.max(startIndex, endIndex) + 1
  );
};

export const latestSdkVersionValues = getLatestCompatibility();

export const AndroidIOSCompatibilityTable = ({ startVersion, endVersion }: VersionRangeProps) => {
  const versionsToShow = getVersionsBetween(startVersion, endVersion);

  if (versionsToShow.length === 0) {
    return <p>One or more SDK versions not found</p>;
  }

  return (
    <Table>
      <TableHead>
        <Row>
          <Cell>Expo SDK version</Cell>
          <Cell>Android version</Cell>
          <Cell>
            <CODE>compileSdkVersion</CODE>
          </Cell>
          <Cell>iOS version</Cell>
          <Cell>Xcode version</Cell>
        </Row>
      </TableHead>
      <tbody>
        {versionsToShow.map(version => (
          <Row key={version.sdk}>
            <Cell>{version.sdk}</Cell>
            <Cell>{version.android}</Cell>
            <Cell>{version.compileSdkVersion}</Cell>
            <Cell>{version.ios}</Cell>
            <Cell>{version.xcode}</Cell>
          </Row>
        ))}
      </tbody>
    </Table>
  );
};

export const ReactNativeVersionTable = ({ startVersion, endVersion }: VersionRangeProps) => {
  const versionsToShow = getVersionsBetween(startVersion, endVersion);

  if (versionsToShow.length === 0) {
    return <p>One or more SDK versions not found</p>;
  }

  return (
    <div>
      <Table>
        <TableHead>
          <Row>
            <Cell>Expo SDK version</Cell>
            <Cell>React Native version</Cell>
            <Cell>React Native Web version</Cell>
          </Row>
        </TableHead>
        <tbody>
          {versionsToShow.map(version => (
            <Row key={version.sdk}>
              <Cell>{version.sdk}</Cell>
              <Cell>{version['react-native']}</Cell>
              <Cell>{version['react-native-web']}</Cell>
            </Row>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
