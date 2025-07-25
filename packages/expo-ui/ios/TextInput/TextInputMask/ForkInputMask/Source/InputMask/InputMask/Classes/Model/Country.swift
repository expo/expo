//
// Project «InputMask»
// Created by Jeorge Taflanidi
//


import Foundation


/**
 ### Country
 
 Model object representing a **Country** record operated by the ``PhoneInputListener``.
 */
public struct Country {
    /**
     International country name.
     */
    public let name: String
    
    /**
     Country name in its own language.
     */
    public let nameNative: String?
    
    /**
     Country emoji.
     */
    public let emoji: String
    
    /**
     Country ISO-3166 code, 2 letters.
     */
    public let iso3166alpha2: String
    
    /**
     Country ISO-3166 code, 3 letters.
     */
    public let iso3166alpha3: String
    
    /**
     Country dial code.
     */
    public let countryCode: String
    
    /**
     Primary ``Mask`` format for the country phone numbers.
     */
    public let primaryFormat: String
    
    /**
     Affine ``Mask`` formats for the country phone numbers.
     */
    public let affineFormats: [String]
    
    /**
     A regular expression to detect whether or not the entered digits correspond to this particular country.
     */
    public let phoneRegex: String
    
    /**
     Constructor.
     
     - Parameters:
        - name: international country name
        - nameNative: country name in its own language
        - emoji: country emoji
        - iso3166alpha2: country ISO-3166 code, 2 letters
        - iso3166alpha3: country ISO-3166 code, 3 letters
        - countryCode: country dial code
        - primaryFormat: primary ``Mask`` format for the country phone numbers
        - affineFormats: affine ``Mask`` formats for the country phone numbers
        - phoneRegex: a regular expression to detect whether or not the entered digits correspond to this particular country
     */
    public init(
        name: String,
        nameNative: String?,
        emoji: String,
        iso3166alpha2: String,
        iso3166alpha3: String,
        countryCode: String,
        primaryFormat: String,
        affineFormats: [String],
        phoneRegex: String
    ) {
        self.name = name
        self.nameNative = nameNative
        self.emoji = emoji
        self.iso3166alpha2 = iso3166alpha2
        self.iso3166alpha3 = iso3166alpha3
        self.countryCode = countryCode
        self.primaryFormat = primaryFormat
        self.affineFormats = affineFormats
        self.phoneRegex = phoneRegex
    }
    
    /**
     Test digits upon this ``Country/phoneRegex``
     */
    public func phoneStartsWith(digits: String) -> Bool {
        return digits.range(of: self.phoneRegex, options: String.CompareOptions.regularExpression) != nil
    }
    
    public static func findCountries(
        amongCountries customCountries: [Country]?,
        withTerms includingTerms: [String]?,
        excluding excludingTerms: [String]?,
        phone: String
    ) -> [Country] {
        let includingTermsLowercased = (includingTerms ?? []).map { $0.lowercased() }
        let excludingTermsLowercased = (excludingTerms ?? []).map { $0.lowercased() }
        let phoneDigits = phone.extractDigits()
        
        return (customCountries ?? all).filter { country in
            var include: Bool = false
            
            if includingTerms != nil {
                include = include
                || includingTermsLowercased.contains(country.name.lowercased())
                || includingTermsLowercased.contains(country.iso3166alpha2.lowercased())
                || includingTermsLowercased.contains(country.iso3166alpha3.lowercased())
                || includingTermsLowercased.contains(country.emoji)
                
                if let nameNative = country.nameNative {
                    include = include || includingTermsLowercased.contains(nameNative)
                }
            } else {
                include = true
            }
            
            var exclude: Bool = false
            
            if excludingTerms != nil {
                exclude = exclude
                || excludingTermsLowercased.contains(country.name.lowercased())
                || excludingTermsLowercased.contains(country.iso3166alpha2.lowercased())
                || excludingTermsLowercased.contains(country.iso3166alpha3.lowercased())
                || excludingTermsLowercased.contains(country.emoji)
                
                if let nameNative = country.nameNative {
                    exclude = exclude || excludingTermsLowercased.contains(nameNative)
                }
            }
            
            include = include && country.phoneStartsWith(digits: phoneDigits)
            
            return include && !exclude
        }
    }
    
    /**
     A ``Country`` dictionary.
     
     Feel free to append/correct & file PRs, see https://countrycode.org
     */
    public static let all: [Country] = [
        Country(
            name: "Canada",
            nameNative: "Canada",
            emoji: "🇨🇦",
            iso3166alpha2: "CA",
            iso3166alpha3: "CAN",
            countryCode: "1",
            primaryFormat: "+{1} [000] [000]-[0000]",
            affineFormats: [],
            phoneRegex: "^1$|^1[2-9]$|^1[2-9][0-8]$|^1204|^1226|^1236|^1249|^1250|^1289|^1306|^1343|^1365|^1367|^1368|^1403|^1416|^1418|^1431|^1437|^1438|^1450|^1474|^1506|^1514|^1519|^1548|^1579|^1581|^1584|^1587|^1604|^1613|^1639|^1647|^1672|^1705|^1709|^1778|^1780|^1782|^1807|^1819|^1825|^1867|^1873|^1902|^1905"
        ),
        Country(
            name: "USA",
            nameNative: "USA",
            emoji: "🇺🇸",
            iso3166alpha2: "US",
            iso3166alpha3: "USA",
            countryCode: "1",
            primaryFormat: "+{1} [000] [000]-[0000]",
            affineFormats: [],
            phoneRegex: "^1$|^1[2-9]$|^1[2-9][0-8]$|^1201|^1202|^1203|^1205|^1206|^1207|^1208|^1209|^1209|^1210|^1212|^1213|^1214|^1215|^1216|^1217|^1218|^1219|^1224|^1225|^1227|^1228|^1229|^1231|^1234|^1239|^1240|^1248|^1251|^1252|^1253|^1254|^1256|^1260|^1262|^1267|^1269|^1270|^1274|^1276|^1278|^1281|^1283|^1301|^1302|^1303|^1304|^1305|^1307|^1308|^1309|^1310|^1312|^1313|^1314|^1315|^1316|^1317|^1318|^1319|^1320|^1321|^1323|^1325|^1330|^1331|^1334|^1336|^1337|^1339|^1341|^1347|^1351|^1352|^1360|^1361|^1364|^1369|^1380|^1385|^1386|^1401|^1402|^1404|^1405|^1406|^1407|^1408|^1409|^1410|^1412|^1413|^1414|^1415|^1417|^1419|^1423|^1424|^1425|^1430|^1432|^1434|^1435|^1440|^1442|^1443|^1445|^1447|^1458|^1464|^1469|^1470|^1475|^1478|^1479|^1480|^1484|^1501|^1502|^1503|^1504|^1505|^1507|^1508|^1509|^1510|^1512|^1513|^1515|^1516|^1517|^1518|^1520|^1530|^1531|^1534|^1540|^1541|^1551|^1557|^1559|^1561|^1562|^1563|^1564|^1567|^1570|^1571|^1573|^1574|^1575|^1580|^1585|^1586|^1601|^1602|^1603|^1605|^1606|^1607|^1608|^1609|^1610|^1612|^1614|^1615|^1616|^1617|^1618|^1619|^1620|^1623|^1626|^1627|^1628|^1630|^1631|^1636|^1641|^1646|^1650|^1651|^1657|^1659|^1660|^1661|^1662|^1667|^1669|^1678|^1679|^1681|^1682|^1689|^1701|^1702|^1703|^1704|^1706|^1707|^1708|^1712|^1713|^1714|^1715|^1716|^1717|^1718|^1719|^1720|^1724|^1727|^1730|^1731|^1732|^1734|^1737|^1740|^1747|^1752|^1754|^1757|^1760|^1762|^1763|^1764|^1765|^1769|^1770|^1772|^1773|^1774|^1775|^1779|^1781|^1785|^1786|^1801|^1802|^1803|^1804|^1805|^1806|^1808|^1810|^1812|^1813|^1814|^1815|^1816|^1817|^1818|^1828|^1830|^1831|^1832|^1835|^1843|^1845|^1847|^1848|^1850|^1856|^1857|^1858|^1859|^1860|^1862|^1863|^1864|^1865|^1870|^1872|^1878|^1901|^1903|^1904|^1906|^1907|^1908|^1909|^1910|^1912|^1913|^1914|^1915|^1916|^1917|^1918|^1919|^1920|^1925|^1927|^1928|^1931|^1935|^1936|^1937|^1938|^1940|^1941|^1947|^1949|^1951|^1952|^1954|^1956|^1957|^1959|^1970|^1971|^1972|^1973|^1975|^1978|^1979|^1980|^1984|^1985|^1989"
        ),
        Country(
            name: "Kazakhstan",
            nameNative: "Қазақстан",
            emoji: "🇰🇿",
            iso3166alpha2: "KZ",
            iso3166alpha3: "KAZ",
            countryCode: "7",
            primaryFormat: "+{7} ([000]) [000]-[00]-[00]",
            affineFormats: [],
            phoneRegex: "^7$|^7[125670]"
        ),
        Country(
            name: "Russian Federation",
            nameNative: "Российская Федерация",
            emoji: "🇷🇺",
            iso3166alpha2: "RU",
            iso3166alpha3: "RUS",
            countryCode: "7",
            primaryFormat: "+{7} ([000]) [000]-[00]-[00]",
            affineFormats: [],
            phoneRegex: "^7$|^7[3489]"
        ),
        Country(
            name: "Egypt",
            nameNative: "مصر",
            emoji: "🇪🇬",
            iso3166alpha2: "EG",
            iso3166alpha3: "EGY",
            countryCode: "20",
            primaryFormat: "+{20}-[90]-[000]-[0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^2$|^20$|^20[1-9]"
        ),
        Country(
            name: "Greece",
            nameNative: "Ελλάδα",
            emoji: "🇬🇷",
            iso3166alpha2: "GR",
            iso3166alpha3: "GRC",
            countryCode: "30",
            primaryFormat: "+{30} [9000] [000] [0000]",
            affineFormats: [
                 // TODO
            ],
            phoneRegex: "^3$|^30"
        ),
        Country(
            name: "Netherlands",
            nameNative: "Nederland",
            emoji: "🇳🇱",
            iso3166alpha2: "NL",
            iso3166alpha3: "NLD",
            countryCode: "31",
            primaryFormat: "+{31} [9000] [000] [0000]",
            affineFormats: [
                 // TODO
            ],
            phoneRegex: "^3$|^31"
        ),
        Country(
            name: "Belgium",
            nameNative: "Koninkrijk België",
            emoji: "🇧🇪",
            iso3166alpha2: "BE",
            iso3166alpha3: "BEL",
            countryCode: "32",
            primaryFormat: "+{32} [990] [900] [00] [00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^32"
        ),
        Country(
            name: "France",
            nameNative: "France",
            emoji: "🇫🇷",
            iso3166alpha2: "FR",
            iso3166alpha3: "FRA",
            countryCode: "33",
            primaryFormat: "+{33} [0] [00] [00] [00] [00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^33"
        ),
        Country(
            name: "Spain",
            nameNative: "España",
            emoji: "🇪🇸",
            iso3166alpha2: "ES",
            iso3166alpha3: "ESP",
            countryCode: "34",
            primaryFormat: "+{34} [000] [000] [000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^34"
        ),
        Country(
            name: "Hungary",
            nameNative: "Magyarország",
            emoji: "🇭🇺",
            iso3166alpha2: "HU",
            iso3166alpha3: "HUN",
            countryCode: "36",
            primaryFormat: "+{36} [90] [000] [000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^36"
        ),
        Country(
            name: "Italy",
            nameNative: "Italia",
            emoji: "🇮🇹",
            iso3166alpha2: "IT",
            iso3166alpha3: "ITA",
            countryCode: "39",
            primaryFormat: "+{39} [990] [000000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^39"
        ),
        Country(
            name: "Romania",
            nameNative: "România",
            emoji: "🇷🇴",
            iso3166alpha2: "RO",
            iso3166alpha3: "ROU",
            countryCode: "40",
            primaryFormat: "+{40} [900] [900] [000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^4$|^40"
        ),
        Country(
            name: "Switzerland",
            nameNative: "Schweezerland",
            emoji: "🇨🇭",
            iso3166alpha2: "CH",
            iso3166alpha3: "CHE",
            countryCode: "41",
            primaryFormat: "+{41} {0}[00] [000] [00] [00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^4$|^41"
        ),
        Country(
            name: "Austria",
            nameNative: "Ausztria",
            emoji: "🇦🇹",
            iso3166alpha2: "AT",
            iso3166alpha3: "AUT",
            countryCode: "43",
            primaryFormat: "+{43} [990] [000] [00] [00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^4$|^43"
        ),
        Country(
            name: "United Kingdom",
            nameNative: "United Kingdom",
            emoji: "🇬🇧",
            iso3166alpha2: "GB",
            iso3166alpha3: "GBR",
            countryCode: "44",
            primaryFormat: "+{44} ([000]) [0000] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^4$|^44"
        ),
        Country(
            name: "Denmark",
            nameNative: "Danmark",
            emoji: "🇩🇰",
            iso3166alpha2: "DK",
            iso3166alpha3: "DNK",
            countryCode: "45",
            primaryFormat: "+{45} [00] [00] [00] [00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^4$|^45"
        ),
        Country(
            name: "Sweden",
            nameNative: "Sverige",
            emoji: "🇸🇪",
            iso3166alpha2: "SE",
            iso3166alpha3: "SWE",
            countryCode: "46",
            primaryFormat: "+{46} [000] [000] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^4$|^46"
        ),
        Country(
            name: "Norway",
            nameNative: "Noorweegen",
            emoji: "🇳🇴",
            iso3166alpha2: "NO",
            iso3166alpha3: "NOR",
            countryCode: "47",
            primaryFormat: "+{47} [00] [00] [00] [00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^4$|^47"
        ),
        Country(
            name: "Poland",
            nameNative: "Polska",
            emoji: "🇵🇱",
            iso3166alpha2: "PL",
            iso3166alpha3: "POL",
            countryCode: "48",
            primaryFormat: "+{48} [00] [000] [00] [00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^4$|^48"
        ),
        Country(
            name: "Germany",
            nameNative: "Deutschland",
            emoji: "🇩🇪",
            iso3166alpha2: "DE",
            iso3166alpha3: "DEU",
            countryCode: "49",
            primaryFormat: "+{49} [99900] [9900] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^4$|^49"
        ),
        Country(
            name: "Peru",
            nameNative: "Perú",
            emoji: "🇵🇪",
            iso3166alpha2: "PE",
            iso3166alpha3: "PER",
            countryCode: "51",
            primaryFormat: "+{51} [000] [000] [000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^5$|^51"
        ),
        Country(
            name: "Mexico",
            nameNative: "México",
            emoji: "🇲🇽",
            iso3166alpha2: "MX",
            iso3166alpha3: "MEX",
            countryCode: "52",
            primaryFormat: "+{52} [0000000000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^5$|^52"
        ),
        Country(
            name: "Cuba",
            nameNative: "Cuba",
            emoji: "🇨🇺",
            iso3166alpha2: "CU",
            iso3166alpha3: "CUB",
            countryCode: "53",
            primaryFormat: "+{53} [00] [000] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^5$|^53"
        ),
        Country(
            name: "Argentina",
            nameNative: "Argentina",
            emoji: "🇦🇷",
            iso3166alpha2: "AR",
            iso3166alpha3: "ARG",
            countryCode: "54",
            primaryFormat: "+{54} [000] [000]–[0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^5$|^54"
        ),
        Country(
            name: "Brazil",
            nameNative: "Brasil",
            emoji: "🇧🇷",
            iso3166alpha2: "BR",
            iso3166alpha3: "BRA",
            countryCode: "55",
            primaryFormat: "+{55} [00] [0000]-[0000]",
            affineFormats: [
                "+{55} [00] 9[0000]-[0000]", // TODO
            ],
            phoneRegex: "^5$|^55"
        ),
        Country(
            name: "Chile",
            nameNative: "Chile",
            emoji: "🇨🇱",
            iso3166alpha2: "CL",
            iso3166alpha3: "CHL",
            countryCode: "56",
            primaryFormat: "+{56} ([000]) [000] [000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^5$|^56"
        ),
        Country(
            name: "Colombia",
            nameNative: "Colombia",
            emoji: "🇨🇴",
            iso3166alpha2: "CO",
            iso3166alpha3: "COL",
            countryCode: "57",
            primaryFormat: "+{57}-[000]-[0000000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^5$|^57"
        ),
        Country(
            name: "Venezuela",
            nameNative: "Venezuela",
            emoji: "🇻🇪",
            iso3166alpha2: "VE",
            iso3166alpha3: "VEN",
            countryCode: "58",
            primaryFormat: "+{58} [000] [0000000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^5$|^58"
        ),
        Country(
            name: "Malaysia",
            nameNative: nil,
            emoji: "🇲🇾",
            iso3166alpha2: "MY",
            iso3166alpha3: "MYS",
            countryCode: "60",
            primaryFormat: "+{60} [990] [9000] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^6$|^60"
        ),
        Country(
            name: "Australia",
            nameNative: "Australia",
            emoji: "🇦🇺",
            iso3166alpha2: "AU",
            iso3166alpha3: "AUS",
            countryCode: "61",
            primaryFormat: "+{61} [000] [000] [000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^6$|^61"
        ),
        Country(
            name: "Indonesia",
            nameNative: "Indonesia",
            emoji: "🇮🇩",
            iso3166alpha2: "ID",
            iso3166alpha3: "IDN",
            countryCode: "62",
            primaryFormat: "+{62} [9000]-[0000]-[0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^6$|^62"
        ),
        Country(
            name: "Philippines",
            nameNative: "Pilipinas",
            emoji: "🇵🇭",
            iso3166alpha2: "PH",
            iso3166alpha3: "PHL",
            countryCode: "63",
            primaryFormat: "+{63} [900]-[000]-[0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^6$|^63"
        ),
        Country(
            name: "New Zealand",
            nameNative: "Aotearoa",
            emoji: "🇳🇿",
            iso3166alpha2: "NZ",
            iso3166alpha3: "NZL",
            countryCode: "64",
            primaryFormat: "+{64} [9000] [000] [9000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^6$|^64"
        ),
        Country(
            name: "Singapore",
            nameNative: "Singapura",
            emoji: "🇸🇬",
            iso3166alpha2: "SG",
            iso3166alpha3: "SGP",
            countryCode: "65",
            primaryFormat: "+{65} [0000] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^6$|^65"
        ),
        Country(
            name: "Thailand",
            nameNative: "ประเทศไทย",
            emoji: "🇹🇭",
            iso3166alpha2: "TH",
            iso3166alpha3: "THA",
            countryCode: "66",
            primaryFormat: "+{66} [0000000000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^6$|^66"
        ),
        Country(
            name: "Japan",
            nameNative: "日本",
            emoji: "🇯🇵",
            iso3166alpha2: "JP",
            iso3166alpha3: "JPN",
            countryCode: "81",
            primaryFormat: "+{81} [9900]-[9900]-[0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^8$|^81"
        ),
        Country(
            name: "South Korea",
            nameNative: "대한민국",
            emoji: "🇰🇷",
            iso3166alpha2: "KR",
            iso3166alpha3: "KOR",
            countryCode: "82",
            primaryFormat: "+{82} [00] [0000] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^8$|^82"
        ),
        Country(
            name: "Vietnam",
            nameNative: "Việt Nam",
            emoji: "🇻🇳",
            iso3166alpha2: "VN",
            iso3166alpha3: "VNM",
            countryCode: "84",
            primaryFormat: "+{84} [0000] [000] [000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^8$|^84"
        ),
        Country(
            name: "China",
            nameNative: "中国",
            emoji: "🇨🇳",
            iso3166alpha2: "CN",
            iso3166alpha3: "CHN",
            countryCode: "86",
            primaryFormat: "+{86} [000]-[0000]-[0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^8$|^86"
        ),
        Country(
            name: "Türkiye",
            nameNative: "Türkiye",
            emoji: "🇹🇷",
            iso3166alpha2: "TR",
            iso3166alpha3: "TUR",
            countryCode: "90",
            primaryFormat: "+{90} ([000]) [000]-[00]-[00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^9$|^90"
        ),
        Country(
            name: "India",
            nameNative: "Bhārat Gaṇarājya",
            emoji: "🇮🇳",
            iso3166alpha2: "IN",
            iso3166alpha3: "IND",
            countryCode: "91",
            primaryFormat: "+{91} [000] [0000000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^9$|^91"
        ),
        Country(
            name: "Pakistan",
            nameNative: "پاکِستان",
            emoji: "🇵🇰",
            iso3166alpha2: "PK",
            iso3166alpha3: "PAK",
            countryCode: "92",
            primaryFormat: "+{92} ([000]) [0000000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^9$|^92"
        ),
        Country(
            name: "Afghanistan",
            nameNative: nil,
            emoji: "🇦🇫",
            iso3166alpha2: "AF",
            iso3166alpha3: "AFG",
            countryCode: "93",
            primaryFormat: "+{93} [00] [0000000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^9$|^93"
        ),
        Country(
            name: "Sri Lanka",
            nameNative: "ශ්‍රී ලංකා",
            emoji: "🇱🇰",
            iso3166alpha2: "LK",
            iso3166alpha3: "LKA",
            countryCode: "94",
            primaryFormat: "+{94} [000]-[000] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^9$|^94"
        ),
        Country(
            name: "Greenland",
            nameNative: "Kalaallit Nunaat",
            emoji: "🇬🇱",
            iso3166alpha2: "GL",
            iso3166alpha3: "GRL",
            countryCode: "299",
            primaryFormat: "+{299} [00] [00] [00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^2$|^29$|^299"
        ),
        Country(
            name: "Portugal",
            nameNative: "Portugal",
            emoji: "🇵🇹",
            iso3166alpha2: "PT",
            iso3166alpha3: "PRT",
            countryCode: "351",
            primaryFormat: "+{351} [000] [000] [9000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^35$|^351"
        ),
        Country(
            name: "Finland",
            nameNative: "Suomi",
            emoji: "🇫🇮",
            iso3166alpha2: "FI",
            iso3166alpha3: "FIN",
            countryCode: "358",
            primaryFormat: "+{358} [0] [000] [000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^35$|^358"
        ),
        Country(
            name: "Lithuania",
            nameNative: "Lietuva",
            emoji: "🇱🇹",
            iso3166alpha2: "LT",
            iso3166alpha3: "LTU",
            countryCode: "370",
            primaryFormat: "+{370} ([9000]) [900] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^37$|^370"
        ),
        Country(
            name: "Latvia",
            nameNative: "Latvija",
            emoji: "🇱🇻",
            iso3166alpha2: "LV",
            iso3166alpha3: "LVA",
            countryCode: "371",
            primaryFormat: "+{371} [900] [9900] [900]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^37$|^371"
        ),
        Country(
            name: "Estonia",
            nameNative: "Eesti",
            emoji: "🇪🇪",
            iso3166alpha2: "EE",
            iso3166alpha3: "EST",
            countryCode: "372",
            primaryFormat: "+{372} [000] [0000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^37$|^372"
        ),
        Country(
            name: "Belarus",
            nameNative: "Белару́сь",
            emoji: "",
            iso3166alpha2: "BY",
            iso3166alpha3: "BLR",
            countryCode: "375",
            primaryFormat: "+{375} ([000]) [000]-[00]-[00]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^3$|^37$|^375"
        ),
        Country(
            name: "Ukraine",
            nameNative: "Україна",
            emoji: "🇺🇦",
            iso3166alpha2: "UA",
            iso3166alpha3: "UKR",
            countryCode: "380",
            primaryFormat: "+{380} ([00]) [000]-[00]-[00]",
            affineFormats: [],
            phoneRegex: "^3$|^38$|^380"
        ),
        Country(
            name: "Georgia",
            nameNative: "საქართველო",
            emoji: "🇬🇪",
            iso3166alpha2: "GE",
            iso3166alpha3: "GEO",
            countryCode: "995",
            primaryFormat: "+{995} ([000]) [000] [000]",
            affineFormats: [
                // TODO
            ],
            phoneRegex: "^9$|^99$|^995"
        ),
    ]
}
