import entries from 'lodash/entries';
import keys from 'lodash/keys';
import size from 'lodash/size';
import values from 'lodash/values';

import resourceSpecs from '~/public/static/resource-specs.json';
import {
  HardwareRSpec,
  HardwareSpecKey,
  ResourcePlatform,
  ResourceSpecData,
} from '~/types/resourceSpecs';
import { markdownComponents } from '~/ui/components/Markdown';

const {
  hardware: hardwareSpecs,
  vm: vmSpecs,
  resources: { android, ios },
} = resourceSpecs as ResourceSpecData;

function formatHardware(hardwares: HardwareRSpec) {
  return keys(hardwares).map(hardware => {
    const { cpu, memory, description } = hardwareSpecs[hardware];
    return `${cpu}, ${memory} (${description})`;
  });
}

function formatVMs(hardwares: HardwareRSpec) {
  return entries(hardwares)
    .map(([hardware, { vm, extra }]) => {
      const { cpu, memory } = vmSpecs[vm];
      if (size(hardwares) === 1) return `${cpu}, ${memory}, ${extra}`;
      return `${cpu}, ${memory}, ${extra} (for builds runnning on ${hardwareSpecs[hardware].name})`;
    })
    .join(' or ');
}

export const iosResourceClasses = values(ios).map(({ symbol }) => symbol);
export const iosResources = values(ios).map(({ symbol, hardware }) => ({
  symbol,
  description: formatVMs(hardware),
}));
export const iosHardware = values(ios).flatMap(({ symbol, hardware }) =>
  keys(hardware).map(name => ({ ...hardwareSpecs[name], symbol }))
);

export const androidResourceClasses = values(android).map(({ symbol }) => symbol);
export const androidResources = values(android).map(({ symbol, hardware }) => ({
  symbol,
  description: formatHardware(hardware),
}));
export const androidHardware = values(android).flatMap(({ symbol, hardware }) =>
  keys(hardware).map((name: HardwareSpecKey) => ({ ...hardwareSpecs[name], symbol }))
);

function buildResourceLink(symbol: string, platform: ResourcePlatform) {
  const platformId = platform === 'ios' ? 2 : 1;
  return (
    <>
      <markdownComponents.code>
        <markdownComponents.a href={`eas-json/#resourceclass-${platformId}`}>
          {symbol}
        </markdownComponents.a>
      </markdownComponents.code>
      :
    </>
  );
}

function gcpLink(description: string) {
  return description
    .split(/(n2-standard-\d+)/)
    .map((part: string) =>
      part.match(/n2-standard-\d+/) ? (
        <markdownComponents.a href="https://cloud.google.com/compute/docs/general-purpose-machines#n2_machines">
          {part}
        </markdownComponents.a>
      ) : (
        part
      )
    );
}

type HardwareListProps = { platform: ResourcePlatform };
type BuildResourceListProps = { platform: ResourcePlatform };

export function HardwareList({ platform }: HardwareListProps) {
  const data = platform === 'ios' ? iosHardware : androidHardware;
  const hardwareList = data.map(({ symbol, cpu, memory, description }, i) => {
    const prefix = platform !== 'ios' && buildResourceLink(symbol, platform);
    return (
      <markdownComponents.li key={i}>
        {prefix} {cpu}, {memory} ({gcpLink(description)})
      </markdownComponents.li>
    );
  });
  return <markdownComponents.ul>{hardwareList}</markdownComponents.ul>;
}

export function BuildResourceList({ platform }: BuildResourceListProps) {
  const data = platform === 'ios' ? iosResources : androidResources;
  const buildResources = data.map(({ symbol, description }, i) => (
    <markdownComponents.li key={i}>
      {buildResourceLink(symbol, platform)} {description}
    </markdownComponents.li>
  ));
  return <markdownComponents.ul>{buildResources}</markdownComponents.ul>;
}
