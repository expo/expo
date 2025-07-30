package expo.modules.ui.textfield.model

/**
 * ### Country
 *
 * Model object representing a **Country** record operated by the ``PhoneInputListener``.
 */
data class Country(
    /**
     * International country name.
     */
    val name: String,

    /**
     * Country name in its own language.
     */
    val nameNative: String?,

    /**
     * Country emoji.
     */
    val emoji: String,

    /**
     * Country ISO-3166 code, 2 valters.
     */
    val iso3166alpha2: String,

    /**
     * Country ISO-3166 code, 3 valters.
     */
    val iso3166alpha3: String,

    /**
     * Country dial code.
     */
    val countryCode: String,

    /**
     * Primary ``Mask`` format for the country phone numbers.
     */
    val primaryFormat: String,

    /**
     * Affine ``Mask`` formats for the country phone numbers.
     */
    val affineFormats: List<String>,

    /**
     * A regular expression to detect whether or not the entered digits correspond to this particular country.
     */
    val phoneRegex: String,
) {
    fun phoneStartsWith(digits: String): Boolean = phoneRegex.toRegex().containsMatchIn(digits)

    companion object {
        fun findCountries(customCountries: List<Country>?, includingTerms: List<String>?, excludingTerms: List<String>?, phone: String): List<Country> {
            val includingTermsLowercased = includingTerms?.map { it.lowercase() } ?: listOf()
            val excludingTermsLowercased = excludingTerms?.map { it.lowercase() } ?: listOf()
            val phoneDigits = phone.filter(Char::isDigit)

            return (customCountries ?: all).filter {
                var include: Boolean = false

                if (includingTerms != null) {
                    include = include
                    || includingTermsLowercased.contains(it.name.lowercase())
                    || includingTermsLowercased.contains(it.iso3166alpha2.lowercase())
                    || includingTermsLowercased.contains(it.iso3166alpha3.lowercase())
                    || includingTermsLowercased.contains(it.emoji)

                    include = include || if (it.nameNative != null) includingTermsLowercased.contains(it.nameNative) else false
                } else {
                    include = true
                }

                var exclude: Boolean = false

                if (excludingTerms != null) {
                    exclude = exclude
                    || excludingTermsLowercased.contains(it.name.lowercase())
                    || excludingTermsLowercased.contains(it.iso3166alpha2.lowercase())
                    || excludingTermsLowercased.contains(it.iso3166alpha3.lowercase())
                    || excludingTermsLowercased.contains(it.emoji)

                    exclude = exclude || if (it.nameNative != null) excludingTermsLowercased.contains(it.nameNative) else false
                }

                include = include && it.phoneStartsWith(phoneDigits)

                include && !exclude
            }
        }

        /**
        A ``Country`` dictionary.

        Feel free to append/correct & file PRs, see https://countrycode.org
         */
        val all: List<Country> = listOf(
            Country(
                "Canada",
                "Canada",
                "🇨🇦",
                "CA",
                "CAN",
                "1",
                "+{1} [000] [000]-[0000]",
                listOf(),
                "^1$|^1[2-9]$|^1[2-9][0-8]$|^1204|^1226|^1236|^1249|^1250|^1289|^1306|^1343|^1365|^1367|^1368|^1403|^1416|^1418|^1431|^1437|^1438|^1450|^1474|^1506|^1514|^1519|^1548|^1579|^1581|^1584|^1587|^1604|^1613|^1639|^1647|^1672|^1705|^1709|^1778|^1780|^1782|^1807|^1819|^1825|^1867|^1873|^1902|^1905"
            ),
            Country(
                "USA",
                "USA",
                "🇺🇸",
                "US",
                "USA",
                "1",
                "+{1} [000] [000]-[0000]",
                listOf(),
                "^1$|^1[2-9]$|^1[2-9][0-8]$|^1201|^1202|^1203|^1205|^1206|^1207|^1208|^1209|^1209|^1210|^1212|^1213|^1214|^1215|^1216|^1217|^1218|^1219|^1224|^1225|^1227|^1228|^1229|^1231|^1234|^1239|^1240|^1248|^1251|^1252|^1253|^1254|^1256|^1260|^1262|^1267|^1269|^1270|^1274|^1276|^1278|^1281|^1283|^1301|^1302|^1303|^1304|^1305|^1307|^1308|^1309|^1310|^1312|^1313|^1314|^1315|^1316|^1317|^1318|^1319|^1320|^1321|^1323|^1325|^1330|^1331|^1334|^1336|^1337|^1339|^1341|^1347|^1351|^1352|^1360|^1361|^1364|^1369|^1380|^1385|^1386|^1401|^1402|^1404|^1405|^1406|^1407|^1408|^1409|^1410|^1412|^1413|^1414|^1415|^1417|^1419|^1423|^1424|^1425|^1430|^1432|^1434|^1435|^1440|^1442|^1443|^1445|^1447|^1458|^1464|^1469|^1470|^1475|^1478|^1479|^1480|^1484|^1501|^1502|^1503|^1504|^1505|^1507|^1508|^1509|^1510|^1512|^1513|^1515|^1516|^1517|^1518|^1520|^1530|^1531|^1534|^1540|^1541|^1551|^1557|^1559|^1561|^1562|^1563|^1564|^1567|^1570|^1571|^1573|^1574|^1575|^1580|^1585|^1586|^1601|^1602|^1603|^1605|^1606|^1607|^1608|^1609|^1610|^1612|^1614|^1615|^1616|^1617|^1618|^1619|^1620|^1623|^1626|^1627|^1628|^1630|^1631|^1636|^1641|^1646|^1650|^1651|^1657|^1659|^1660|^1661|^1662|^1667|^1669|^1678|^1679|^1681|^1682|^1689|^1701|^1702|^1703|^1704|^1706|^1707|^1708|^1712|^1713|^1714|^1715|^1716|^1717|^1718|^1719|^1720|^1724|^1727|^1730|^1731|^1732|^1734|^1737|^1740|^1747|^1752|^1754|^1757|^1760|^1762|^1763|^1764|^1765|^1769|^1770|^1772|^1773|^1774|^1775|^1779|^1781|^1785|^1786|^1801|^1802|^1803|^1804|^1805|^1806|^1808|^1810|^1812|^1813|^1814|^1815|^1816|^1817|^1818|^1828|^1830|^1831|^1832|^1835|^1843|^1845|^1847|^1848|^1850|^1856|^1857|^1858|^1859|^1860|^1862|^1863|^1864|^1865|^1870|^1872|^1878|^1901|^1903|^1904|^1906|^1907|^1908|^1909|^1910|^1912|^1913|^1914|^1915|^1916|^1917|^1918|^1919|^1920|^1925|^1927|^1928|^1931|^1935|^1936|^1937|^1938|^1940|^1941|^1947|^1949|^1951|^1952|^1954|^1956|^1957|^1959|^1970|^1971|^1972|^1973|^1975|^1978|^1979|^1980|^1984|^1985|^1989"
            ),
            Country(
                "Kazakhstan",
                "Қазақстан",
                "🇰🇿",
                "KZ",
                "KAZ",
                "7",
                "+{7} ([000]) [000]-[00]-[00]",
                listOf(),
                "^7$|^7[125670]"
            ),
            Country(
                "Russian Federation",
                "Российская Федерация",
                "🇷🇺",
                "RU",
                "RUS",
                "7",
                "+{7} ([000]) [000]-[00]-[00]",
                listOf(),
                "^7$|^7[3489]"
            ),
            Country(
                "Egypt",
                "مصر",
                "🇪🇬",
                "EG",
                "EGY",
                "20",
                "+{20}-[90]-[000]-[0000]",
                listOf(
                    // TODO
                ),
                "^2$|^20$|^20[1-9]"
            ),
            Country(
                "Greece",
                "Ελλάδα",
                "🇬🇷",
                "GR",
                "GRC",
                "30",
                "+{30} [9000] [000] [0000]",
                listOf(
                    // TODO
                ),
                "^3$|^30"
            ),
            Country(
                "Netherlands",
                "Nederland",
                "🇳🇱",
                "NL",
                "NLD",
                "31",
                "+{31} [9000] [000] [0000]",
                listOf(
                    // TODO
                ),
                "^3$|^31"
            ),
            Country(
                "Belgium",
                "Koninkrijk België",
                "🇧🇪",
                "BE",
                "BEL",
                "32",
                "+{32} [990] [900] [00] [00]",
                listOf(
                    // TODO
                ),
                "^3$|^32"
            ),
            Country(
                "France",
                "France",
                "🇫🇷",
                "FR",
                "FRA",
                "33",
                "+{33} [0] [00] [00] [00] [00]",
                listOf(
                    // TODO
                ),
                "^3$|^33"
            ),
            Country(
                "Spain",
                "España",
                "🇪🇸",
                "ES",
                "ESP",
                "34",
                "+{34} [000] [000] [000]",
                listOf(
                    // TODO
                ),
                "^3$|^34"
            ),
            Country(
                "Hungary",
                "Magyarország",
                "🇭🇺",
                "HU",
                "HUN",
                "36",
                "+{36} [90] [000] [000]",
                listOf(
                    // TODO
                ),
                "^3$|^36"
            ),
            Country(
                "Italy",
                "Italia",
                "🇮🇹",
                "IT",
                "ITA",
                "39",
                "+{39} [990] [000000]",
                listOf(
                    // TODO
                ),
                "^3$|^39"
            ),
            Country(
                "Romania",
                "România",
                "🇷🇴",
                "RO",
                "ROU",
                "40",
                "+{40} [900] [900] [000]",
                listOf(
                    // TODO
                ),
                "^4$|^40"
            ),
            Country(
                "Switzerland",
                "Schweezerland",
                "🇨🇭",
                "CH",
                "CHE",
                "41",
                "+{41} {0}[00] [000] [00] [00]",
                listOf(
                    // TODO
                ),
                "^4$|^41"
            ),
            Country(
                "Austria",
                "Ausztria",
                "🇦🇹",
                "AT",
                "AUT",
                "43",
                "+{43} [990] [000] [00] [00]",
                listOf(
                    // TODO
                ),
                "^4$|^43"
            ),
            Country(
                "United Kingdom",
                "United Kingdom",
                "🇬🇧",
                "GB",
                "GBR",
                "44",
                "+{44} ([000]) [0000] [0000]",
                listOf(
                    // TODO
                ),
                "^4$|^44"
            ),
            Country(
                "Denmark",
                "Danmark",
                "🇩🇰",
                "DK",
                "DNK",
                "45",
                "+{45} [00] [00] [00] [00]",
                listOf(
                    // TODO
                ),
                "^4$|^45"
            ),
            Country(
                "Sweden",
                "Sverige",
                "🇸🇪",
                "SE",
                "SWE",
                "46",
                "+{46} [000] [000] [0000]",
                listOf(
                    // TODO
                ),
                "^4$|^46"
            ),
            Country(
                "Norway",
                "Noorweegen",
                "🇳🇴",
                "NO",
                "NOR",
                "47",
                "+{47} [00] [00] [00] [00]",
                listOf(
                    // TODO
                ),
                "^4$|^47"
            ),
            Country(
                "Poland",
                "Polska",
                "🇵🇱",
                "PL",
                "POL",
                "48",
                "+{48} [00] [000] [00] [00]",
                listOf(
                    // TODO
                ),
                "^4$|^48"
            ),
            Country(
                "Germany",
                "Deutschland",
                "🇩🇪",
                "DE",
                "DEU",
                "49",
                "+{49} [99900] [9900] [0000]",
                listOf(
                    // TODO
                ),
                "^4$|^49"
            ),
            Country(
                "Peru",
                "Perú",
                "🇵🇪",
                "PE",
                "PER",
                "51",
                "+{51} [000] [000] [000]",
                listOf(
                    // TODO
                ),
                "^5$|^51"
            ),
            Country(
                "Mexico",
                "México",
                "🇲🇽",
                "MX",
                "MEX",
                "52",
                "+{52} [0000000000]",
                listOf(
                    // TODO
                ),
                "^5$|^52"
            ),
            Country(
                "Cuba",
                "Cuba",
                "🇨🇺",
                "CU",
                "CUB",
                "53",
                "+{53} [00] [000] [0000]",
                listOf(
                    // TODO
                ),
                "^5$|^53"
            ),
            Country(
                "Argentina",
                "Argentina",
                "🇦🇷",
                "AR",
                "ARG",
                "54",
                "+{54} [000] [000]–[0000]",
                listOf(
                    // TODO
                ),
                "^5$|^54"
            ),
            Country(
                "Brazil",
                "Brasil",
                "🇧🇷",
                "BR",
                "BRA",
                "55",
                "+{55} [00] [0000]-[0000]",
                listOf(
                        "+{55} [00] 9[0000]-[0000]", // TODO
                ),
                "^5$|^55"
            ),
            Country(
                "Chile",
                "Chile",
                "🇨🇱",
                "CL",
                "CHL",
                "56",
                "+{56} ([000]) [000] [000]",
                listOf(
                    // TODO
                ),
                "^5$|^56"
            ),
            Country(
                "Colombia",
                "Colombia",
                "🇨🇴",
                "CO",
                "COL",
                "57",
                "+{57}-[000]-[0000000]",
                listOf(
                    // TODO
                ),
                "^5$|^57"
            ),
            Country(
                "Venezuela",
                "Venezuela",
                "🇻🇪",
                "VE",
                "VEN",
                "58",
                "+{58} [000] [0000000]",
                listOf(
                    // TODO
                ),
                "^5$|^58"
            ),
            Country(
                "Malaysia",
                null,
                "🇲🇾",
                "MY",
                "MYS",
                "60",
                "+{60} [990] [9000] [0000]",
                listOf(
                    // TODO
                ),
                "^6$|^60"
            ),
            Country(
                "Australia",
                "Australia",
                "🇦🇺",
                "AU",
                "AUS",
                "61",
                "+{61} [000] [000] [000]",
                listOf(
                    // TODO
                ),
                "^6$|^61"
            ),
            Country(
                "Indonesia",
                "Indonesia",
                "🇮🇩",
                "ID",
                "IDN",
                "62",
                "+{62} [9000]-[0000]-[0000]",
                listOf(
                    // TODO
                ),
                "^6$|^62"
            ),
            Country(
                "Philippines",
                "Pilipinas",
                "🇵🇭",
                "PH",
                "PHL",
                "63",
                "+{63} [900]-[000]-[0000]",
                listOf(
                    // TODO
                ),
                "^6$|^63"
            ),
            Country(
                "New Zealand",
                "Aotearoa",
                "🇳🇿",
                "NZ",
                "NZL",
                "64",
                "+{64} [9000] [000] [9000]",
                listOf(
                    // TODO
                ),
                "^6$|^64"
            ),
            Country(
                "Singapore",
                "Singapura",
                "🇸🇬",
                "SG",
                "SGP",
                "65",
                "+{65} [0000] [0000]",
                listOf(
                    // TODO
                ),
                "^6$|^65"
            ),
            Country(
                "Thailand",
                "ประเทศไทย",
                "🇹🇭",
                "TH",
                "THA",
                "66",
                "+{66} [0000000000]",
                listOf(
                    // TODO
                ),
                "^6$|^66"
            ),
            Country(
                "Japan",
                "日本",
                "🇯🇵",
                "JP",
                "JPN",
                "81",
                "+{81} [9900]-[9900]-[0000]",
                listOf(
                    // TODO
                ),
                "^8$|^81"
            ),
            Country(
                "South Korea",
                "대한민국",
                "🇰🇷",
                "KR",
                "KOR",
                "82",
                "+{82} [00] [0000] [0000]",
                listOf(
                    // TODO
                ),
                "^8$|^82"
            ),
            Country(
                "Vietnam",
                "Việt Nam",
                "🇻🇳",
                "VN",
                "VNM",
                "84",
                "+{84} [0000] [000] [000]",
                listOf(
                    // TODO
                ),
                "^8$|^84"
            ),
            Country(
                "China",
                "中国",
                "🇨🇳",
                "CN",
                "CHN",
                "86",
                "+{86} [000]-[0000]-[0000]",
                listOf(
                    // TODO
                ),
                "^8$|^86"
            ),
            Country(
                "Türkiye",
                "Türkiye",
                "🇹🇷",
                "TR",
                "TUR",
                "90",
                "+{90} ([000]) [000]-[00]-[00]",
                listOf(
                    // TODO
                ),
                "^9$|^90"
            ),
            Country(
                "India",
                "Bhārat Gaṇarājya",
                "🇮🇳",
                "IN",
                "IND",
                "91",
                "+{91} [000] [0000000]",
                listOf(
                    // TODO
                ),
                "^9$|^91"
            ),
            Country(
                "Pakistan",
                "پاکِستان",
                "🇵🇰",
                "PK",
                "PAK",
                "92",
                "+{92} ([000]) [0000000]",
                listOf(
                    // TODO
                ),
                "^9$|^92"
            ),
            Country(
                "Afghanistan",
                null,
                "🇦🇫",
                "AF",
                "AFG",
                "93",
                "+{93} [00] [0000000]",
                listOf(
                    // TODO
                ),
                "^9$|^93"
            ),
            Country(
                "Sri Lanka",
                "ශ්‍රී ලංකා",
                "🇱🇰",
                "LK",
                "LKA",
                "94",
                "+{94} [000]-[000] [0000]",
                listOf(
                    // TODO
                ),
                "^9$|^94"
            ),
            Country(
                "Greenland",
                "Kalaallit Nunaat",
                "🇬🇱",
                "GL",
                "GRL",
                "299",
                "+{299} [00] [00] [00]",
                listOf(
                    // TODO
                ),
                "^2$|^29$|^299"
            ),
            Country(
                "Portugal",
                "Portugal",
                "🇵🇹",
                "PT",
                "PRT",
                "351",
                "+{351} [000] [000] [9000]",
                listOf(
                    // TODO
                ),
                "^3$|^35$|^351"
            ),
            Country(
                "Finland",
                "Suomi",
                "🇫🇮",
                "FI",
                "FIN",
                "358",
                "+{358} [0] [000] [000]",
                listOf(
                    // TODO
                ),
                "^3$|^35$|^358"
            ),
            Country(
                "Lithuania",
                "Lietuva",
                "🇱🇹",
                "LT",
                "LTU",
                "370",
                "+{370} ([9000]) [900] [0000]",
                listOf(
                    // TODO
                ),
                "^3$|^37$|^370"
            ),
            Country(
                "Latvia",
                "Latvija",
                "🇱🇻",
                "LV",
                "LVA",
                "371",
                "+{371} [900] [9900] [900]",
                listOf(
                    // TODO
                ),
                "^3$|^37$|^371"
            ),
            Country(
                "Estonia",
                "Eesti",
                "🇪🇪",
                "EE",
                "EST",
                "372",
                "+{372} [000] [0000]",
                listOf(
                    // TODO
                ),
                "^3$|^37$|^372"
            ),
            Country(
                "Belarus",
                "Белару́сь",
                "",
                "BY",
                "BLR",
                "375",
                "+{375} ([000]) [000]-[00]-[00]",
                listOf(
                    // TODO
                ),
                "^3$|^37$|^375"
            ),
            Country(
                "Ukraine",
                "Україна",
                "🇺🇦",
                "UA",
                "UKR",
                "380",
                "+{380} ([00]) [000]-[00]-[00]",
                listOf(),
                "^3$|^38$|^380"
            ),
            Country(
                "Georgia",
                "საქართველო",
                "🇬🇪",
                "GE",
                "GEO",
                "995",
                "+{995} ([000]) [000] [000]",
                listOf(
                    // TODO
                ),
                "^9$|^99$|^995"
            ),
        )

    }

}
