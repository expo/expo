import { mergeClasses } from '@expo/styleguide';
import { AppleIcon } from '@expo/styleguide-icons/custom/AppleIcon';
import { GithubIcon } from '@expo/styleguide-icons/custom/GithubIcon';
import { Smartphone02Icon } from '@expo/styleguide-icons/custom/Smartphone02Icon';
import { Cloud01Icon } from '@expo/styleguide-icons/outline/Cloud01Icon';
import { Dataflow03Icon } from '@expo/styleguide-icons/outline/Dataflow03Icon';
import { Users01Icon } from '@expo/styleguide-icons/outline/Users01Icon';
import { Fragment } from 'react';

const PLACE_ICONS = {
  GitHub: [GithubIcon],
  'GitHub Actions': [GithubIcon],
  'GitHub or TestFlight': [GithubIcon, AppleIcon],
  'EAS Workflows': [Dataflow03Icon],
  'EAS Hosting': [Cloud01Icon],
  'Expo Simulators': [Smartphone02Icon],
  'Your team': [Users01Icon],
};

type Stage = {
  place: keyof typeof PLACE_ICONS;
  text: string;
  onExpo?: boolean;
};

const AGENTIC_WORKFLOW_STAGES: Stage[] = [
  {
    place: 'GitHub or TestFlight',
    text: 'A pull request, an issue, or tester feedback starts a workflow',
  },
  {
    place: 'EAS Workflows',
    text: 'A job finds or builds the app and starts a coding agent',
    onExpo: true,
  },
  {
    place: 'Expo Simulators',
    text: 'A session runs the app on a cloud simulator',
    onExpo: true,
  },
  {
    place: 'Expo Simulators',
    text: 'The agent uses the app and saves screenshots and a recording',
    onExpo: true,
  },
  { place: 'GitHub', text: 'The job posts the verdict and the evidence' },
  { place: 'Your team', text: 'A person reviews the evidence and decides' },
];

const ISSUE_TO_PR_STAGES: Stage[] = [
  { place: 'GitHub', text: 'A person adds the agent label to an issue' },
  { place: 'GitHub Actions', text: 'An Action starts the Issue to PR workflow' },
  {
    place: 'EAS Workflows',
    text: 'A coding agent changes the code and opens a pull request',
    onExpo: true,
  },
  {
    place: 'EAS Workflows',
    text: 'Agentic CI finds or builds the app and starts a session',
    onExpo: true,
  },
  {
    place: 'Expo Simulators',
    text: 'A coding agent tests the change on a cloud simulator',
    onExpo: true,
  },
  { place: 'GitHub', text: 'A person reviews the verdict and merges the pull request' },
];

const BUG_TRIAGE_STAGES: Stage[] = [
  { place: 'GitHub or TestFlight', text: 'A bug report arrives as an issue or as tester feedback' },
  {
    place: 'EAS Workflows',
    text: 'The workflow files feedback as an issue, and finds or builds the app',
    onExpo: true,
  },
  {
    place: 'Expo Simulators',
    text: 'A coding agent follows the steps of the report on a cloud simulator',
    onExpo: true,
  },
  { place: 'GitHub', text: 'The workflow posts the verdict and the evidence on the issue' },
  { place: 'Your team', text: 'A person reads the report and adds the agent label' },
  {
    place: 'EAS Workflows',
    text: 'Issue to PR opens a fix, and Agentic CI tests it',
    onExpo: true,
  },
];

const QA_SWARM_STAGES: Stage[] = [
  { place: 'Your team', text: 'A person starts the QA Swarm workflow' },
  {
    place: 'EAS Workflows',
    text: 'A job finds or builds the app for each platform',
    onExpo: true,
  },
  {
    place: 'Expo Simulators',
    text: 'Each lane starts its own cloud simulator at the same time',
    onExpo: true,
  },
  {
    place: 'Expo Simulators',
    text: 'A coding agent in each lane runs one flow and saves screenshots',
    onExpo: true,
  },
  {
    place: 'EAS Hosting',
    text: 'Each lane deploys an evidence site',
    onExpo: true,
  },
  { place: 'Your team', text: 'A person reads the report with the verdict of each lane' },
];

export function AgenticWorkflowDiagram() {
  return <StageDiagram stages={AGENTIC_WORKFLOW_STAGES} />;
}

export function BugTriageDiagram() {
  return <StageDiagram stages={BUG_TRIAGE_STAGES} />;
}

export function QaSwarmDiagram() {
  return <StageDiagram stages={QA_SWARM_STAGES} />;
}

export function IssueToPrDiagram() {
  return <StageDiagram stages={ISSUE_TO_PR_STAGES} />;
}

function StageDiagram({ stages }: { stages: Stage[] }) {
  const alt = stages
    .map((stage, index) => `${index + 1}. ${stage.text} [${stage.place}]`)
    .join('\n→ ');
  return (
    <div
      className="@container my-5 rounded-3xl border border-default bg-default p-4"
      data-md="diagram"
      data-md-alt={alt}>
      <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2 @2xl:grid-cols-3 @5xl:flex @5xl:gap-2">
        {stages.map((stage, index) => (
          <Fragment key={stage.text}>
            {index > 0 && <Arrow />}
            <div
              className={mergeClasses(
                'relative min-w-0 flex-1 rounded-md border px-2.5 py-2 shadow-xs',
                stage.onExpo ? 'border-info bg-info' : 'border-default bg-subtle'
              )}>
              <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full border border-default bg-default text-[10px] font-semibold text-default">
                {index + 1}
              </span>
              <span className="mb-1 block text-center text-[10px] font-semibold tracking-wide text-tertiary uppercase">
                {PLACE_ICONS[stage.place].map((Icon, iconIndex) => (
                  <Icon
                    key={iconIndex}
                    aria-hidden="true"
                    className="-mt-0.5 mr-1 inline icon-xs text-icon-secondary"
                  />
                ))}
                {stage.place}
              </span>
              <p className="text-center text-xs leading-snug text-default">{stage.text}</p>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      className="hidden h-2 w-5 shrink-0 self-center text-icon-secondary @5xl:block"
      viewBox="0 0 20 8"
      aria-hidden="true">
      <path d="M0 4h17M17 4l-4-3M17 4l-4 3" stroke="currentColor" strokeWidth={1.25} fill="none" />
    </svg>
  );
}
