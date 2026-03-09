/**
 * Lightweight client for the Unblocked API (https://getunblocked.com).
 *
 * Provides helpers to authenticate and ask questions against the
 * Unblocked knowledge base. Reads `UNBLOCKED_API_KEY` from the environment.
 */

import open from 'open';
import { v4 as uuidv4 } from 'uuid';

import { sleepAsync } from './Utils';

const BASE_URL = 'https://getunblocked.com/api/v1';

export type Reference = {
  htmlUrl: string;
};

/** Normalized answer returned by our helpers. */
export type Answer = {
  state: string;
  questionId: string;
  question: string;
  answer?: string;
  references?: Reference[];
};

/** Raw shape from the Unblocked API. */
type RawAnswerResponse = {
  state: string;
  questionId?: string;
  question?: string;
  result?: {
    answer?: string;
    references?: Reference[];
  };
  // Flat fallback fields (in case the API changes)
  answer?: string;
  references?: Reference[];
};

function getApiKey(): string {
  const key = process.env.UNBLOCKED_API_KEY;
  if (!key) {
    throw new Error(
      'UNBLOCKED_API_KEY environment variable is not set. Run authenticateAsync() to get a token.'
    );
  }
  return key;
}

async function requestAsync(method: string, path: string, body?: object): Promise<Response> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (response.status === 401) {
      throw new Error(`Unblocked API: invalid or expired token (401). ${text}`);
    }
    if (response.status === 403) {
      throw new Error(
        `Unblocked API: forbidden — your plan may not support this feature (403). ${text}`
      );
    }
    throw new Error(`Unblocked API error ${response.status}: ${text}`);
  }

  return response;
}

/**
 * Checks whether the current UNBLOCKED_API_KEY is valid.
 * Returns true on 200, false on 401/403.
 */
export async function isAuthenticatedAsync(): Promise<boolean> {
  try {
    await requestAsync('GET', '/collections?limit=1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Opens the Unblocked API tokens settings page in the browser
 * and logs instructions to the console.
 */
export async function authenticateAsync(): Promise<void> {
  const url = 'https://getunblocked.com/dashboard/settings/api-tokens';
  console.log(`Opening ${url} …`);
  console.log('Create a new API token and paste it when prompted.');
  await open(url);
}

/**
 * Sets the API key for the current process.
 */
export function setApiKey(key: string): void {
  process.env.UNBLOCKED_API_KEY = key;
}

/**
 * Submits a question to Unblocked and returns the question ID
 * that can be used to poll for the answer.
 */
export async function submitQuestionAsync(question: string): Promise<string> {
  const questionId = uuidv4();
  await requestAsync('PUT', `/answers/${questionId}`, { question });
  return questionId;
}

/**
 * Fetches the current state of an answer by question ID.
 * Normalizes the API response (answer/references may be nested under `result`).
 */
export async function getAnswerAsync(questionId: string): Promise<Answer> {
  const response = await requestAsync('GET', `/answers/${questionId}`);
  const raw = (await response.json()) as RawAnswerResponse;
  return {
    state: raw.state,
    questionId: raw.questionId ?? questionId,
    question: raw.question ?? '',
    answer: raw.result?.answer ?? raw.answer,
    references: raw.result?.references ?? raw.references,
  };
}

/**
 * High-level helper: submits a question and polls until the answer
 * is complete, then returns the full Answer object.
 *
 * Polls with exponential backoff starting at 1 s, capped at 10 s.
 * Times out after `timeoutMs` (default 120 s).
 */
export async function askQuestionAsync(
  question: string,
  opts?: { timeoutMs?: number }
): Promise<Answer> {
  const timeoutMs = opts?.timeoutMs ?? 120_000;
  const questionId = await submitQuestionAsync(question);

  const start = Date.now();
  let delay = 1000;

  while (Date.now() - start < timeoutMs) {
    await sleepAsync(delay);
    const answer = await getAnswerAsync(questionId);
    if (answer.state === 'complete' || answer.state === 'completed' || answer.state === 'failed') {
      return answer;
    }
    delay = Math.min(delay * 1.5, 10_000);
  }

  throw new Error(`Timed out waiting for answer to question "${question}" after ${timeoutMs}ms`);
}
