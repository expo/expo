'use strict';

import * as EASClient from 'expo-eas-client';

export const name = 'EASClient';

export async function test(t) {
  t.describe('EASClient', () => {
    t.it('gets the EAS client ID', () => {
      const clientId = EASClient.clientID;
      t.expect(clientId).toBeTruthy();
      const clientId2 = EASClient.clientID;
      t.expect(clientId).toEqual(clientId2);
    });
  });
}
