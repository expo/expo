/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package abi48_0_0.host.exp.exponent.modules.api.netinfo.types;

// Based on the ConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
public enum ConnectionType {
    BLUETOOTH("bluetooth"),
    CELLULAR("cellular"),
    ETHERNET("ethernet"),
    NONE("none"),
    UNKNOWN("unknown"),
    WIFI("wifi"),
    WIMAX("wimax"),
    VPN("vpn");

    public final String label;

    ConnectionType(String label) {
        this.label = label;
    }
}
