import { detectAgent } from 'agent-cli-detector';

import { debugEvent as event } from '../events';

export type AgentTelemetryContext = {
  id: string;
  sessionId: string | undefined;
};

let agentTelemetryContext: AgentTelemetryContext | null | undefined;

export function getAgentTelemetryContext(): AgentTelemetryContext | null {
  if (agentTelemetryContext === undefined) {
    agentTelemetryContext = resolveAgentTelemetryContext();
  }

  return agentTelemetryContext;
}

function resolveAgentTelemetryContext(): AgentTelemetryContext | null {
  try {
    const { agent, detected } = detectAgent();
    if (!detected || agent == null) {
      return null;
    }
    return { id: agent.id, sessionId: agent.sessionId };
  } catch (error: any) {
    event('agent_detect_failed', { error: event.error(error as Error) });
    return null;
  }
}
