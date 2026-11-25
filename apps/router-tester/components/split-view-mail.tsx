import { createContext } from 'react';

export const MESSAGES = [
  {
    id: 'security-alert',
    sender: 'Google',
    subject: 'Security alert',
    date: 'Today at 9:41',
    body: 'A new sign-in on an iPad was detected. If this was you, you do not need to do anything.',
  },
  {
    id: 'google-photos',
    sender: 'Google Photos',
    subject: 'Welcome to Google Photos',
    date: 'Yesterday at 18:02',
    body: 'Back up your photos and videos, and find them on any device.',
  },
  {
    id: 'instagram',
    sender: 'Instagram',
    subject: 'See more from your friends',
    date: 'Monday at 12:15',
    body: 'Follow the people you know to see their photos and videos.',
  },
];

// The last pressed toolbar button and the press count, shown in the columns and in the route.
export const ToolbarPressContext = createContext('None');
