import {
  Heading,
  Spacer,
  View,
  Text,
  useExpoPalette,
  Row,
  ChevronRightIcon,
  BranchIcon,
  UpdateIcon,
  scale,
} from 'expo-dev-client-components';
import * as React from 'react';

import { Branch } from '../queries/useBranchesForApp';
import { Update } from '../queries/useUpdatesForBranch';

type EASBranchRowProps = {
  branch: Branch;
};

export function EASBranchRow({ branch }: EASBranchRowProps) {
  const palette = useExpoPalette();

  const { name, updates } = branch;
  const latestUpdate = updates[0];

  return (
    <View>
      <Row>
        <Row
          style={{ backgroundColor: palette.blue['100'] }}
          py="tiny"
          px="1.5"
          rounded="medium"
          align="center">
          <BranchIcon
            style={{ maxHeight: 10, maxWidth: 12, resizeMode: 'contain' }}
            resizeMethod="scale"
          />
          <Spacer.Horizontal size="tiny" />
          <Text size="small">{`Branch: ${name}`}</Text>
        </Row>

        <View style={{ position: 'absolute', right: 0, top: scale.tiny }}>
          <ChevronRightIcon />
        </View>
      </Row>

      <Spacer.Vertical size="small" />

      {latestUpdate != null && (
        <Row>
          <View>
            <Spacer.Vertical size="tiny" />
            <UpdateIcon />
          </View>
          <Spacer.Horizontal size="small" />
          <View flex="1" shrink="1">
            <Heading size="small" numberOfLines={1}>
              {`Update "${latestUpdate.message}"`}
            </Heading>
            <Spacer.Horizontal size="large" />
            <Spacer.Vertical size="tiny" />
            <Text size="small" color="secondary">
              {`Published ${latestUpdate?.createdAt}`}
            </Text>
          </View>

          <Spacer.Horizontal size="large" />
        </Row>
      )}
      <Spacer.Vertical size="small" />
    </View>
  );
}

export function EASEmptyBranchRow({ branch }: EASBranchRowProps) {
  const palette = useExpoPalette();

  const { name } = branch;

  return (
    <View>
      <Row>
        <Row
          style={{ backgroundColor: palette.blue['100'] }}
          py="tiny"
          px="1.5"
          rounded="medium"
          align="center">
          <BranchIcon
            style={{ maxHeight: 10, maxWidth: 12, resizeMode: 'contain' }}
            resizeMethod="scale"
          />
          <Spacer.Horizontal size="tiny" />
          <Text size="small">{`Branch: ${name}`}</Text>
        </Row>

        <View style={{ position: 'absolute', right: 0, top: scale.tiny }}>
          <ChevronRightIcon />
        </View>
      </Row>

      <Spacer.Vertical size="small" />

      <Row>
        <View flex="1" shrink="1">
          <Heading size="small" numberOfLines={1} color="secondary">
            No updates available.
          </Heading>
          <Spacer.Horizontal size="large" />
          <Spacer.Vertical size="tiny" />
        </View>

        <Spacer.Horizontal size="large" />
      </Row>
    </View>
  );
}

type EASUpdateRowProps = {
  update: Update;
};

export function EASUpdateRow({ update }: EASUpdateRowProps) {
  return (
    <View>
      <View style={{ position: 'absolute', right: 0, top: scale.tiny }}>
        <ChevronRightIcon />
      </View>

      <Spacer.Vertical size="small" />

      <Row>
        <View>
          <Spacer.Vertical size="tiny" />
          <UpdateIcon />
        </View>
        <Spacer.Horizontal size="small" />
        <View flex="1" shrink="1">
          <Heading size="small" numberOfLines={1}>
            {`Update "${update.message}"`}
          </Heading>
          <Spacer.Horizontal size="large" />
          <Spacer.Vertical size="tiny" />
          <Text size="small" color="secondary">
            {`Published ${update.createdAt}`}
          </Text>
        </View>

        <Spacer.Horizontal size="large" />
      </Row>
      <Spacer.Vertical size="small" />
    </View>
  );
}
