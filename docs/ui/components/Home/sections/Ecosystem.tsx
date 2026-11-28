import { DocsLogo } from '@expo/styleguide';
import { EasBuildIcon } from '@expo/styleguide-icons/custom/EasBuildIcon';
import { EasSubmitIcon } from '@expo/styleguide-icons/custom/EasSubmitIcon';
import { ActivityIcon } from '@expo/styleguide-icons/outline/ActivityIcon';
import { Cloud01Icon } from '@expo/styleguide-icons/outline/Cloud01Icon';
import { Dataflow01Icon } from '@expo/styleguide-icons/outline/Dataflow01Icon';
import { LayersTwo01Icon } from '@expo/styleguide-icons/outline/LayersTwo01Icon';
import { Phone01Icon } from '@expo/styleguide-icons/outline/Phone01Icon';
import { TerminalSquareIcon } from '@expo/styleguide-icons/outline/TerminalSquareIcon';
import { type ComponentType, type HTMLAttributes } from 'react';

import { CardText, HomeCard, SectionHeader } from '~/ui/components/Home/components';

type EcosystemEntry = {
  title: string;
  description: string;
  href: string;
  Icon: ComponentType<HTMLAttributes<SVGSVGElement>>;
};

const ECOSYSTEM: EcosystemEntry[] = [
  {
    title: 'SDK',
    description: 'Create a universal Android, iOS, and web app with the Expo SDK',
    href: '/versions/latest/',
    Icon: DocsLogo,
  },
  {
    title: 'Submit',
    description: 'Ship to the app stores without the busywork',
    href: '/deploy/submit-to-app-stores/',
    Icon: EasSubmitIcon,
  },
  {
    title: 'Workflows',
    description: 'Mobile CI/CD built for React Native',
    href: '/eas/workflows/introduction/',
    Icon: Dataflow01Icon,
  },
  {
    title: 'Build',
    description:
      'Create signed iOS and Android builds for Expo and React Native apps without managing build infrastructure.',
    href: '/build/introduction/',
    Icon: EasBuildIcon,
  },
  {
    title: 'Updates',
    description:
      'Instantly deliver live updates, bug fixes, content changes, beta features, and more',
    href: '/eas-update/introduction/',
    Icon: LayersTwo01Icon,
  },
  {
    title: 'Hosting',
    description: 'Deploy your app to the web and host API routes in one command.',
    href: '/eas/hosting/introduction/',
    Icon: Cloud01Icon,
  },
  {
    title: 'Observe',
    description: 'Monitoring that knows your build pipeline to measure how your app feels.',
    href: '/eas/observe/introduction/',
    Icon: ActivityIcon,
  },
  {
    title: 'Simulator',
    description: "Put a screen in your agent's hands. Spin up secure cloud simulators on demand.",
    href: '/eas/simulators/introduction/',
    Icon: Phone01Icon,
  },
  {
    title: 'MCP',
    description: 'Equip your AI assistants with the knowledge to build native Expo apps.',
    href: '/mcp/',
    Icon: TerminalSquareIcon,
  },
];

export function Ecosystem() {
  return (
    <>
      <SectionHeader title="The expo ecosystem" />
      <div className="grid grid-cols-3 gap-x-4 gap-y-6 max-lg:grid-cols-2 max-md:grid-cols-1">
        {ECOSYSTEM.map(({ title, description, href, Icon }) => (
          <HomeCard key={title} href={href} className="gap-12">
            <Icon aria-hidden="true" className="icon-lg shrink-0 text-icon-default" />
            <CardText title={title}>{description}</CardText>
          </HomeCard>
        ))}
      </div>
    </>
  );
}
