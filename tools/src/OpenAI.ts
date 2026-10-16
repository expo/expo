import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  client ??= new OpenAI({
    organization: process.env.OPENAI_API_ORG,
    apiKey: process.env.OPENAI_API_KEY,
  });
  return client;
}

export async function askChatGPTAsync(question: string): Promise<string | undefined> {
  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages: [{ role: 'user', content: question }],
  });

  return response.choices[0]?.message?.content ?? undefined;
}
