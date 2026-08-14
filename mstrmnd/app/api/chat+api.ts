import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from 'ai';
import { DEPARTMENT_AGENTS, MAIN_AGENT } from '@/constants/agents';

export async function POST(req: Request) {
  const body = await req.json();
  const messages = (body.messages ?? []) as UIMessage[];
  const agentId = (body.agentId as string) || 'conductor';
  const agent =
    agentId === MAIN_AGENT.id
      ? MAIN_AGENT
      : DEPARTMENT_AGENTS.find((a) => a.id === agentId) ?? MAIN_AGENT;

  const system =
    (body.systemPrompt as string) ||
    agent.systemPrompt ||
    MAIN_AGENT.systemPrompt;

  const result = streamText({
    model: 'xai/grok-4.5',
    system,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'none',
    },
  });
}
