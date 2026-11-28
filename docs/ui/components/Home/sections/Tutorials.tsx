import { CardText, HomeCard, PillButton, SectionHeader } from '~/ui/components/Home/components';

const TUTORIALS = [
  {
    title: 'Get started with Expo',
    description: 'New to Expo? A step-by-step guide on how to build an Expo app.',
    href: '/tutorial/introduction/',
  },
  {
    title: 'Build with AI',
    description: 'Build your first app by directing an AI coding agent.',
    href: '/tutorial/build-with-ai/introduction/',
  },
  {
    title: 'Services',
    description: 'This tutorial covers the Expo Build, Update, and Submit workflows.',
    href: '/tutorial/eas/introduction/',
  },
];

export function Tutorials() {
  return (
    <>
      <SectionHeader
        title="Tutorials"
        action={<PillButton href="/tutorial/overview/">view all</PillButton>}
      />
      <div className="grid grid-cols-3 gap-x-4 gap-y-6 max-lg:grid-cols-2 max-md:grid-cols-1">
        {TUTORIALS.map(({ title, description, href }) => (
          <HomeCard key={title} href={href}>
            <CardText title={title}>{description}</CardText>
          </HomeCard>
        ))}
      </div>
    </>
  );
}
