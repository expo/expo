import { LinearClient } from '@linear/sdk';

const linearClient = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });

export default linearClient;
