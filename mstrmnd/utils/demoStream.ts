import type { DepartmentAgent } from '@/constants/agents';
import { MAIN_AGENT } from '@/constants/agents';

const BEATS = [
  'Scanning your operating cadence…',
  'Aligning with the rest of the pad grid…',
  'Framing the next move…',
];

/** Local streaming simulator when no AI Gateway key is configured */
export async function streamDemoReply(
  agent: DepartmentAgent | typeof MAIN_AGENT,
  prompt: string,
  onChunk: (text: string) => void,
) {
  const opener = `${agent.name} online. `;
  const body =
    agent.id === 'conductor'
      ? `I’ll route this across the mastermind grid. You asked: “${prompt.trim()}”. ` +
        `Suggested pad sequence: STRAT → DATA → OPS. Draft: clarify the outcome metric, ` +
        `assign an owner pad, then run a 48h experiment loop. Tap a department pad to go deeper.`
      : `${agent.department} desk engaged. On “${prompt.trim()}”: ` +
        `1) Define the success signal. 2) Strip work that doesn’t move it. ` +
        `3) Hand off blockers to adjacent pads. ${BEATS[Math.floor(Math.random() * BEATS.length)]} ` +
        `Say the word and I’ll produce a one-page playbook for ${agent.department}.`;

  const full = opener + body;
  for (const char of full) {
    onChunk(char);
    await new Promise((r) => setTimeout(r, 8 + Math.random() * 18));
  }
}
