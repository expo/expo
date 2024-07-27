import * as Subprotocol from '@daniel-nagy/transporter/build/Subprotocol';
import * as SuperJson from '@daniel-nagy/transporter/build/SuperJson';

/**
 * The communication protocol between the native app and the web app.
 */
// @ts-ignore
export const protocol: Subprotocol.t<SuperJson.t> = Subprotocol.init({
  connectionMode: Subprotocol.ConnectionMode.ConnectionOriented,
  dataType: Subprotocol.DataType<SuperJson.t>(),
  operationMode: Subprotocol.OperationMode.Unicast,
  transmissionMode: Subprotocol.TransmissionMode.Duplex,
});
