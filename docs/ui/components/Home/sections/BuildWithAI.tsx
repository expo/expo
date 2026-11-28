import { mergeClasses } from '@expo/styleguide';
import { ArrowNarrowRightIcon } from '@expo/styleguide-icons/outline/ArrowNarrowRightIcon';
import { Asterisk02Icon } from '@expo/styleguide-icons/outline/Asterisk02Icon';
import { type ComponentType } from 'react';

import { CardText, HomeCard, PillButton, SectionHeader } from '~/ui/components/Home/components';
import {
  AgenticWorkflowsIllustration,
  EnterpriseIllustration,
  GetStartedIllustration,
  MobileDevIllustration,
  StudentsIllustration,
} from '~/ui/components/Home/resources';

type Persona = {
  title: string;
  description: string;
  href: string;
  Illustration: ComponentType;
};

const MOBILE_DEV: Persona = {
  title: 'Mobile dev',
  description: 'Get the latest and greatest',
  href: '/core-concepts/',
  Illustration: MobileDevIllustration,
};

const SECOND_ROW: Persona[] = [
  {
    title: 'Enterprise',
    description: 'Cloud service provider at scale',
    href: '/eas/',
    Illustration: EnterpriseIllustration,
  },
  {
    title: 'Students',
    description: 'Learning to build mobile apps',
    href: '/tutorial/overview/',
    Illustration: StudentsIllustration,
  },
  {
    title: 'Agentic workflows',
    description: 'Interact with Expo at machine speed',
    href: '/agentic-workflows/introduction/',
    Illustration: AgenticWorkflowsIllustration,
  },
];

const PERSONA_CARD_CLASSES = 'h-80 min-w-0 flex-1 gap-6 overflow-hidden';

function PersonaCard({ title, description, href, Illustration }: Persona) {
  return (
    <HomeCard href={href} className={PERSONA_CARD_CLASSES}>
      <CardText title={title} className="gap-0">
        {description}
      </CardText>
      <Illustration />
    </HomeCard>
  );
}

export function BuildWithAI() {
  return (
    <>
      <SectionHeader
        title="Build apps with AI"
        className="pt-0"
        action={
          <PillButton
            href="/agents/"
            leftSlot={
              <Asterisk02Icon aria-hidden="true" className="icon-2xs text-button-secondary-icon" />
            }
            rightSlot={
              <ArrowNarrowRightIcon
                aria-hidden="true"
                className="icon-2xs text-button-secondary-icon"
              />
            }>
            Agent mode
          </PillButton>
        }
      />
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 max-md:flex-col">
          <HomeCard
            href="/get-started/create-a-project/"
            className={mergeClasses(
              PERSONA_CARD_CLASSES,
              'w-158.5 flex-none gap-12 max-md:w-full'
            )}>
            <CardText title="Get started" className="w-98 max-w-full gap-0">
              New to Expo? A step-by-step guide on how to build an Expo app for you, your agent or a
              friend with an app idea.
            </CardText>
            <GetStartedIllustration />
          </HomeCard>
          <PersonaCard {...MOBILE_DEV} />
        </div>
        <div className="flex gap-4 max-md:flex-col">
          {SECOND_ROW.map(persona => (
            <PersonaCard key={persona.title} {...persona} />
          ))}
        </div>
      </div>
    </>
  );
}
