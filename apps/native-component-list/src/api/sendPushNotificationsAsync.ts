import * as Notifications from 'expo-notifications';

// In this test app we contact the Expo push service directly. You *never*
// should do this in a real app. You should always store the push tokens on your
// own server or use the local notification API if you want to notify this user.
const PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export async function sendPushNotificationsAsync({
  data,
  categoryId,
}: { data?: Record<string, string>; categoryId?: string | null } = {}) {
  // this method assumes the user has already granted permission
  // to receive remote notifications.

  // Get the token that uniquely identifies this device
  const { data: token } = await Notifications.getExpoPushTokenAsync();

  // Log it so we can easily copy it if we need to work with it
  console.log(`Got this device's push token: ${token}`);

  // POST the token to the Expo push server
  const response = await fetch(PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        to: token,
        title: 'Welcome to Expo!',
        body: 'Native Component List is registered for push notifications.',
        data: data ?? { example: 'sample data' },
        categoryId,
      },
    ]),
  });

  const result = await response.json();
  if (result.errors) {
    for (const error of result.errors) {
      console.warn(`API error sending push notification:`, error);
    }
  }

  const tickets = result.data;
  if (tickets) {
    const ticket = tickets[0];
    if (ticket.status === 'error') {
      if (ticket.details) {
        console.warn(
          `Expo push service reported an error accepting a notification: ${ticket.details.error}`
        );
      }
      if (ticket.__debug) {
        console.warn(ticket.__debug);
      }
    }
  }

  // Check push receipts after a delay to confirm delivery
  const receiptIds = (tickets ?? [])
    .filter((ticket: { status: string; id?: string }) => ticket.status === 'ok')
    .map((ticket: { id: string }) => ticket.id);

  if (receiptIds.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const receiptResponse = await fetch(PUSH_ENDPOINT.replace('/send', '/getReceipts'), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: receiptIds }),
    });

    const receiptResult = await receiptResponse.json();
    console.log({ receipts: JSON.stringify(receiptResult, null, 2) });

    if (receiptResult.data) {
      for (const [id, receipt] of Object.entries(receiptResult.data) as [string, any][]) {
        if (receipt.status === 'error') {
          console.warn(`Receipt ${id} error: ${receipt.message}`);
          if (receipt.details?.error) {
            console.warn(`Error code: ${receipt.details.error}`);
          }
        }
      }
    }
  }
}
