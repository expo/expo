import { Notifications } from 'expo';

import Constants from 'expo-constants';

const demoBodies: { [type: string]: any } = {
  simple: {
    title: 'Welcome to Expo!',
    body: 'Native Component List is registered for push notifications.',
    data: { example: 'sample data' },
  },
  image: {
    title: 'Kodiak bear',
    body:
      'A Kodiak bear in Kodiak National Wildlife Refuge, Alaska, United States.\n\nSource: https://commons.wikimedia.org/wiki/File:2010-kodiak-bear-1.jpg',
    richContent: {
      image: 'https://upload.wikimedia.org/wikipedia/commons/7/71/2010-kodiak-bear-1.jpg',
    },
    data: {
      trinomialName: 'Ursus arctos middendorffi',
    },
  },
  audio: {
    title: 'Moonlight',
    body:
      'Piano Sonata No. 14 in C sharp minor "Moonlight". Recorded 1924.\n\nSource: https://www.gutenberg.org/ebooks/10178',
    richContent: {
      audio: 'https://www.gutenberg.org/files/10178/10178-m/10178-m-001.mp3',
    },
    data: {
      composer: 'Ludwig van Beethoven',
    },
  },
  gif: {
    title: 'Phenakistoscope',
    body:
      "Eadweard Muybridge's Phenakistoscope: A Couple Waltzing.\n\nSource: https://commons.wikimedia.org/wiki/File:Phenakistoscope_3g07690d.gif",
    richContent: {
      video: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Phenakistoscope_3g07690d.gif',
    },
  },
  video: {
    title: 'Out There Trailer',
    body:
      'By the European Southern Observatory.\n\nSource: https://www.eso.org/public/videos/OutThere_trailer_en/',
    richContent: {
      video: 'https://cdn.eso.org/videos/medium_podcast/OutThere_trailer_en.mp4',
    },
  },
  imageWithCustomIcon: {
    title: 'Jaguar head shot',
    body:
      'Potrait of a jaguar at the Milwaukee County Zoological Gardens in Milwaukee, Wisconsin.\n\nSource: https://commons.wikimedia.org/wiki/File:Jaguar_head_shot-edit2.jpg and https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Jaguar_head_icon.svg/600px-Jaguar_head_icon.svg.png',
    richContent: {
      image: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Jaguar_head_shot-edit2.jpg',
    },
    icon:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Jaguar_head_icon.svg/600px-Jaguar_head_icon.svg.png',
    data: {
      binomialName: 'Panthera onca',
    },
  },
};

// In this test app we contact the Expo push service directly. You *never*
// should do this in a real app. You should always store the push tokens on your
// own server or use the local notification API if you want to notify this user.
const PUSH_ENDPOINT = 'https://expo.io/--/api/v2/push/send';

export default async function registerForPushNotificationsAsync(type: string) {
  // this method assumes the user has already granted permission
  // to receive remote notificartions.

  // Get the token that uniquely identifies this device
  const token = await Notifications.getExpoPushTokenAsync();

  // Log it so we can easily copy it if we need to work with it
  console.log(`Got this device's push token: ${token}`);

  await Notifications.createCategoryAsync('welcome', [
    {
      actionId: 'tada',
      buttonTitle: '🎉',
      isDestructive: false,
      isAuthenticationRequired: false,
    },
    {
      actionId: 'heart_eyes',
      buttonTitle: '😍',
      isDestructive: false,
      isAuthenticationRequired: true,
    },
  ]);

  // POST the token to the Expo push server
  const response = await fetch(PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        to: token,
        _category: `${Constants.manifest.id}:welcome`,
        ...demoBodies[type],
      },
    ]),
  });

  const result = await response.json();
  if (result.errors) {
    for (const error of result.errors) {
      console.warn(`API error sending push notification:`, error);
    }
  }

  const receipts = result.data;
  if (receipts) {
    const receipt = receipts[0];
    if (receipt.status === 'error') {
      if (receipt.details) {
        console.warn(
          `Expo push service reported an error sending a notification: ${
            receipt.details.error
          }`
        );
      }
      if (receipt.__debug) {
        console.warn(receipt.__debug);
      }
    }
  }
}
