import { mergeClasses } from '@expo/styleguide';
import { Fragment } from 'react';

type Stage = {
  place: string;
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

export function AgenticWorkflowDiagram() {
  return <StageDiagram stages={AGENTIC_WORKFLOW_STAGES} />;
}

export function BugTriageDiagram() {
  return <StageDiagram stages={BUG_TRIAGE_STAGES} />;
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
      className="my-5 rounded-3xl border border-default bg-default p-4"
      data-md="diagram"
      data-md-alt={alt}>
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:gap-2">
        {stages.map((stage, index) => (
          <Fragment key={stage.text}>
            {index > 0 && <Arrow />}
            <div
              className={mergeClasses(
                'relative flex-1 rounded-md border px-2.5 py-2 shadow-xs',
                stage.onExpo ? 'border-info bg-info' : 'border-default bg-subtle'
              )}>
              <span className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full border border-default bg-default text-[10px] font-semibold text-default">
                {index + 1}
              </span>
              <span className="mb-1 block text-center text-[10px] font-semibold tracking-wide text-tertiary uppercase">
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
      className="hidden h-2 w-5 shrink-0 self-center text-icon-secondary md:block"
      viewBox="0 0 20 8"
      aria-hidden="true">
      <path d="M0 4h17M17 4l-4-3M17 4l-4 3" stroke="currentColor" strokeWidth={1.25} fill="none" />
    </svg>
  );
}
