import { google } from 'googleapis';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const feedbackLines = req.body.split('\n');
    const feedbackContent = feedbackLines.splice(0, feedbackLines.length - 2).slice(3);
    try {
      const result = await postFeedback(feedbackContent.join('\n'));
      res.status(200).send({ result });
    } catch (error: any) {
      res.status(500).send({ error });
    }
  }
}

export async function postFeedback(feedbackContent: string) {
  try {
    const auth = await google.auth.getClient({
      projectId: 'docsfeedbacktest',
      credentials: {
        type: 'service_account',
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
        token_url: 'https://oauth2.googleapis.com/token',
        universe_domain: 'googleapis.com',
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'A:A',
    });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `A${currentData.data.values?.length ?? 1}`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        majorDimension: 'ROWS',
        values: [[feedbackContent]],
      },
    });
    console.warn(response);
  } catch (error: any) {
    console.error(error);
    throw error;
  }

  return true;
}
