import { detectAgent } from 'agent-cli-detector';

const debug = require('debug')('expo:telemetry:agent') as typeof console.log;

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
    debug('Failed to detect coding agent: %s', error?.message ?? error);
    return null;
  }
}
