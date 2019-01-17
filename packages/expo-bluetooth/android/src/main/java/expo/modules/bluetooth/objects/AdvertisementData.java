package expo.modules.bluetooth.objects;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class AdvertisementData {

  private static final long BLUETOOTH_BASE_UUID_LSB = 0x800000805F9B34FBL;
  private static final int BLUETOOTH_BASE_UUID_MSB = 0x00001000;
  private byte[] manufacturerData;
  private Map<UUID, byte[]> serviceData;
  private ArrayList<UUID> serviceUUIDs;
  private String localName;
  private Integer txPowerLevel;
  private ArrayList<UUID> solicitedServiceUUIDs;

  public static AdvertisementData parseScanResponseData(byte[] advertisement) {
    AdvertisementData advData = new AdvertisementData();
    ByteBuffer rawData = ByteBuffer.wrap(advertisement).order(ByteOrder.LITTLE_ENDIAN);
    while (rawData.remaining() >= 2) {
      int adLength = rawData.get() & 0xFF;
      if (adLength == 0) break;
      adLength -= 1;
      int adType = rawData.get() & 0xFF;
      if (rawData.remaining() < adLength) break;
      parseAdvertisementData(advData, adType, adLength, rawData.slice().order(ByteOrder.LITTLE_ENDIAN));
      rawData.position(rawData.position() + adLength);
    }
    return advData;
  }

  private static void parseAdvertisementData(AdvertisementData advData, int adType, int adLength, ByteBuffer data) {
    switch (adType) {

      case 0x02:
      case 0x03:
        parseServiceUUIDs(advData, adLength, data, 2);
        break;
      case 0x04:
      case 0x05:
        parseServiceUUIDs(advData, adLength, data, 4);
        break;
      case 0x06:
      case 0x07:
        parseServiceUUIDs(advData, adLength, data, 16);
        break;

      case 0xFF:
        parseManufacturerData(advData, adLength, data);
        break;

      case 0x08:
      case 0x09:
        parseLocalName(advData, adType, adLength, data);
        break;

      case 0x0A:
        parseTxPowerLevel(advData, adLength, data);
        break;

      case 0x14:
        parseSolicitedServiceUUIDs(advData, adLength, data, 2);
        break;
      case 0x1F:
        parseSolicitedServiceUUIDs(advData, adLength, data, 4);
        break;
      case 0x15:
        parseSolicitedServiceUUIDs(advData, adLength, data, 16);
        break;

      case 0x16:
        parseServiceData(advData, adLength, data, 2);
        break;
      case 0x20:
        parseServiceData(advData, adLength, data, 4);
        break;
      case 0x21:
        parseServiceData(advData, adLength, data, 16);
        break;
    }
  }

  private static void parseLocalName(AdvertisementData advData, int adType, int adLength, ByteBuffer data) {
    // Complete local name is preferred over short local name.
    if (advData.localName == null || adType == 0x09) {
      byte[] bytes = new byte[adLength];
      data.get(bytes, 0, adLength);
      advData.localName = new String(bytes, Charset.forName("UTF-8"));
    }
  }

  private static UUID parseUUID(ByteBuffer data, int uuidLength) {
    long lsb;
    long msb;
    switch (uuidLength) {
      case 2:
        msb = (((long) data.getShort() & 0xFFFF) << 32) + BLUETOOTH_BASE_UUID_MSB;
        lsb = BLUETOOTH_BASE_UUID_LSB;
        break;
      case 4:
        msb = ((long) data.getInt() << 32) + BLUETOOTH_BASE_UUID_MSB;
        lsb = BLUETOOTH_BASE_UUID_LSB;
        break;
      case 16:
        lsb = data.getLong();
        msb = data.getLong();
        break;
      default:
        data.position(data.position() + uuidLength);
        return null;
    }
    return new UUID(msb, lsb);
  }

  private static void parseSolicitedServiceUUIDs(AdvertisementData advData, int adLength, ByteBuffer data, int uuidLength) {
    if (advData.solicitedServiceUUIDs == null) advData.solicitedServiceUUIDs = new ArrayList<>();
    while (data.remaining() >= uuidLength && data.position() < adLength) {
      advData.solicitedServiceUUIDs.add(parseUUID(data, uuidLength));
    }
  }

  private static void parseServiceUUIDs(AdvertisementData advData, int adLength, ByteBuffer data, int uuidLength) {
    if (advData.serviceUUIDs == null) advData.serviceUUIDs = new ArrayList<>();
    while (data.remaining() >= uuidLength && data.position() < adLength) {
      advData.serviceUUIDs.add(parseUUID(data, uuidLength));
    }
  }

  private static void parseServiceData(AdvertisementData advData, int adLength, ByteBuffer data, int uuidLength) {
    if (adLength < uuidLength) return;
    if (advData.serviceData == null) advData.serviceData = new HashMap<>();
    UUID serviceUUID = parseUUID(data, uuidLength);
    int serviceDataLength = adLength - uuidLength;
    byte[] serviceData = new byte[serviceDataLength];
    data.get(serviceData, 0, serviceDataLength);
    advData.serviceData.put(serviceUUID, serviceData);
  }

  private static void parseTxPowerLevel(AdvertisementData advData, int adLength, ByteBuffer data) {
    if (adLength != 1) return;
    advData.txPowerLevel = (int) data.get();
  }

  private static void parseManufacturerData(AdvertisementData advData, int adLength, ByteBuffer data) {
    if (adLength < 2) return;
    advData.manufacturerData = new byte[adLength];
    data.get(advData.manufacturerData, 0, adLength);
  }

  public String getLocalName() {
    return localName;
  }

  public byte[] getManufacturerData() {
    return manufacturerData;
  }

  public Map<UUID, byte[]> getServiceData() {
    return serviceData;
  }

  public ArrayList<UUID> getServiceUUIDs() {
    return serviceUUIDs;
  }

  public Integer getTxPowerLevel() {
    return txPowerLevel;
  }

  public ArrayList<UUID> getSolicitedServiceUUIDs() {
    return solicitedServiceUUIDs;
  }
}