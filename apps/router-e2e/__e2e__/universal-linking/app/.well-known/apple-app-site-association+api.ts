// Support dynamically generating the AASA file for testing purposes.
const { APPLE_TEAM_ID, APPLE_BUNDLE_ID } = process.env;

const ID = `${APPLE_TEAM_ID}.${APPLE_BUNDLE_ID}`;

export function GET() {
  return Response.json({
    applinks: {
      details: [
        {
          appIDs: [ID],
          components: [
            {
              '/': '*',
              comment: 'Matches all routes',
            },
          ],
        },
      ],
    },
    activitycontinuation: {
      apps: [ID],
    },
    webcredentials: {
      apps: [ID],
    },
    appclips: {
      apps: [`${ID}.clip`],
    },
  });
}
