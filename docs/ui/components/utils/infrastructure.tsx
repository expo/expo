import { markdownComponents } from '~/ui/components/Markdown';

export const ResourceClasses = { android: ['medium', 'large'], ios: ['medium', 'large'] } as const;

const AndroidResourceClassToSpec: Record<(typeof ResourceClasses.android)[number], JSX.Element> = {
  medium: (
    <>
      4 vCPUs, 16 GB RAM (
      <markdownComponents.a href="https://cloud.google.com/compute/docs/general-purpose-machines#n2_machine_types">
        n2-standard-4
      </markdownComponents.a>{' '}
      Google Cloud machine type)
    </>
  ),
  large: (
    <>
      8 vCPUs, 32 GB RAM (
      <markdownComponents.a href="https://cloud.google.com/compute/docs/general-purpose-machines#n2_machine_types">
        n2-standard-8
      </markdownComponents.a>{' '}
      Google Cloud machine type)
    </>
  ),
};

const IosResourceClassToSpec: Record<(typeof ResourceClasses.ios)[number], JSX.Element> = {
  medium: <>3 vCPUs, 8 GB RAM</>,
  large: (
    <>
      <markdownComponents.ul>
        <markdownComponents.li>6 vCPUs, 22 GB RAM if running on an M2 Mac</markdownComponents.li>
        <markdownComponents.li>
          5 vCPUs, 12 GB RAM if running on an M2 Pro Mac
        </markdownComponents.li>
      </markdownComponents.ul>
    </>
  ),
};

function ResourceClassSpecLink({
  resourceClass,
  platform,
}: {
  resourceClass: string;
  platform: 'android' | 'ios';
}) {
  const platformId = platform === 'ios' ? 2 : 1;
  return (
    <markdownComponents.a href={`/eas/json/#resourceclass-${platformId}`}>
      {resourceClass}
    </markdownComponents.a>
  );
}

export function BuildResourceList({ platform }: { platform: keyof typeof ResourceClasses }) {
  const spec = platform === 'ios' ? IosResourceClassToSpec : AndroidResourceClassToSpec;
  return (
    <markdownComponents.ul>
      {ResourceClasses[platform].map(resourceClass => (
        <markdownComponents.li>
          <markdownComponents.code>
            <ResourceClassSpecLink platform={platform} resourceClass={resourceClass} />
          </markdownComponents.code>
          : {spec[resourceClass]}
        </markdownComponents.li>
      ))}
    </markdownComponents.ul>
  );
}
