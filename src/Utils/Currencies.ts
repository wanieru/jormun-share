import { Numbers } from "./Numbers";

export class Currencies
{
    private static currencies = [
        { iso: "AED", name: "United Arab Emirates dirham", format: "", decimals: 2 },
        { iso: "AFN", name: "Afghan afghani", format: "", decimals: 2 },
        { iso: "ALL", name: "Albanian lek", format: "", decimals: 2 },
        { iso: "AMD", name: "Armenian dram", format: "", decimals: 2 },
        { iso: "ANG", name: "Netherlands Antillean guilder", format: "", decimals: 2 },
        { iso: "AOA", name: "Angolan kwanza", format: "", decimals: 2 },
        { iso: "ARS", name: "Argentine peso", format: "", decimals: 2 },
        { iso: "AUD", name: "Australian dollar", format: "A$", decimals: 2 },
        { iso: "AWG", name: "Aruban florin", format: "", decimals: 2 },
        { iso: "AZN", name: "Azerbaijani manat", format: "", decimals: 2 },
        { iso: "BAM", name: "Bosnia and Herzegovina convertible mark", format: "", decimals: 2 },
        { iso: "BBD", name: "Barbados dollar", format: "", decimals: 2 },
        { iso: "BDT", name: "Bangladeshi taka", format: "", decimals: 2 },
        { iso: "BGN", name: "Bulgarian lev", format: "", decimals: 2 },
        { iso: "BHD", name: "Bahraini dinar", format: "", decimals: 3 },
        { iso: "BIF", name: "Burundian franc", format: "", decimals: 0 },
        { iso: "BMD", name: "Bermudian dollar", format: "", decimals: 2 },
        { iso: "BND", name: "Brunei dollar", format: "", decimals: 2 },
        { iso: "BOB", name: "Boliviano", format: "", decimals: 2 },
        { iso: "BRL", name: "Brazilian real", format: "", decimals: 2 },
        { iso: "BSD", name: "Bahamian dollar", format: "", decimals: 2 },
        { iso: "BTN", name: "Bhutanese ngultrum", format: "", decimals: 2 },
        { iso: "BWP", name: "Botswana pula", format: "", decimals: 2 },
        { iso: "BYN", name: "Belarusian ruble", format: "", decimals: 2 },
        { iso: "BZD", name: "Belize dollar", format: "", decimals: 2 },
        { iso: "CAD", name: "Canadian dollar", format: "CA$*", decimals: 2 },
        { iso: "CDF", name: "Congolese franc", format: "", decimals: 2 },
        { iso: "CHF", name: "Swiss franc", format: "", decimals: 2 },
        { iso: "CLP", name: "Chilean peso", format: "", decimals: 0 },
        { iso: "CNY", name: "Renminbi", format: "*元", decimals: 2 },
        { iso: "COP", name: "Colombian peso", format: "", decimals: 2 },
        { iso: "CRC", name: "Costa Rican colon", format: "", decimals: 2 },
        { iso: "CUC", name: "Cuban convertible peso", format: "", decimals: 2 },
        { iso: "CUP", name: "Cuban peso", format: "", decimals: 2 },
        { iso: "CVE", name: "Cape Verdean escudo", format: "", decimals: 2 },
        { iso: "CZK", name: "Czech koruna", format: "", decimals: 2 },
        { iso: "DJF", name: "Djiboutian franc", format: "", decimals: 0 },
        { iso: "DKK", name: "Danish krone", format: "* kr", decimals: 2, locale: "da-DK" },
        { iso: "DOP", name: "Dominican peso", format: "", decimals: 2 },
        { iso: "DZD", name: "Algerian dinar", format: "", decimals: 2 },
        { iso: "EGP", name: "Egyptian pound", format: "", decimals: 2 },
        { iso: "ERN", name: "Eritrean nakfa", format: "", decimals: 2 },
        { iso: "ETB", name: "Ethiopian birr", format: "", decimals: 2 },
        { iso: "EUR", name: "Euro", format: "€*", decimals: 2 },
        { iso: "FJD", name: "Fiji dollar", format: "", decimals: 2 },
        { iso: "FKP", name: "Falkland Islands pound", format: "", decimals: 2 },
        { iso: "GBP", name: "Pound sterling", format: "£*", decimals: 2 },
        { iso: "GEL", name: "Georgian lari", format: "", decimals: 2 },
        { iso: "GHS", name: "Ghanaian cedi", format: "", decimals: 2 },
        { iso: "GIP", name: "Gibraltar pound", format: "", decimals: 2 },
        { iso: "GMD", name: "Gambian dalasi", format: "", decimals: 2 },
        { iso: "GNF", name: "Guinean franc", format: "", decimals: 0 },
        { iso: "GTQ", name: "Guatemalan quetzal", format: "", decimals: 2 },
        { iso: "GYD", name: "Guyanese dollar", format: "", decimals: 2 },
        { iso: "HKD", name: "Hong Kong dollar", format: "HK$*", decimals: 2 },
        { iso: "HNL", name: "Honduran lempira", format: "", decimals: 2 },
        { iso: "HRK", name: "Croatian kuna", format: "", decimals: 2 },
        { iso: "HTG", name: "Haitian gourde", format: "", decimals: 2 },
        { iso: "HUF", name: "Hungarian forint", format: "", decimals: 2 },
        { iso: "IDR", name: "Indonesian rupiah", format: "", decimals: 2 },
        { iso: "ILS", name: "Israeli new shekel", format: "", decimals: 2 },
        { iso: "INR", name: "Indian rupee", format: "₹*", decimals: 2 },
        { iso: "IQD", name: "Iraqi dinar", format: "", decimals: 3 },
        { iso: "IRR", name: "Iranian rial", format: "", decimals: 2 },
        { iso: "ISK", name: "Icelandic króna", format: "", decimals: 0 },
        { iso: "JMD", name: "Jamaican dollar", format: "", decimals: 2 },
        { iso: "JOD", name: "Jordanian dinar", format: "", decimals: 3 },
        { iso: "JPY", name: "Japanese yen", format: "*円", decimals: 0 },
        { iso: "KES", name: "Kenyan shilling", format: "", decimals: 2 },
        { iso: "KGS", name: "Kyrgyzstani som", format: "", decimals: 2 },
        { iso: "KHR", name: "Cambodian riel", format: "", decimals: 2 },
        { iso: "KMF", name: "Comoro franc", format: "", decimals: 0 },
        { iso: "KPW", name: "North Korean won", format: "", decimals: 2 },
        { iso: "KRW", name: "South Korean won", format: "₩*", decimals: 0 },
        { iso: "KWD", name: "Kuwaiti dinar", format: "", decimals: 3 },
        { iso: "KYD", name: "Cayman Islands dollar", format: "", decimals: 2 },
        { iso: "KZT", name: "Kazakhstani tenge", format: "", decimals: 2 },
        { iso: "LAK", name: "Lao kip", format: "", decimals: 2 },
        { iso: "LBP", name: "Lebanese pound", format: "", decimals: 2 },
        { iso: "LKR", name: "Sri Lankan rupee", format: "", decimals: 2 },
        { iso: "LRD", name: "Liberian dollar", format: "", decimals: 2 },
        { iso: "LSL", name: "Lesotho loti", format: "", decimals: 2 },
        { iso: "LYD", name: "Libyan dinar", format: "", decimals: 3 },
        { iso: "MAD", name: "Moroccan dirham", format: "", decimals: 2 },
        { iso: "MDL", name: "Moldovan leu", format: "", decimals: 2 },
        { iso: "MGA", name: "Malagasy ariary", format: "", decimals: 2 },
        { iso: "MKD", name: "Macedonian denar", format: "", decimals: 2 },
        { iso: "MMK", name: "Myanmar kyat", format: "", decimals: 2 },
        { iso: "MNT", name: "Mongolian tögrög", format: "", decimals: 2 },
        { iso: "MOP", name: "Macanese pataca", format: "", decimals: 2 },
        { iso: "MRU", name: "Mauritanian ouguiya", format: "", decimals: 2 },
        { iso: "MUR", name: "Mauritian rupee", format: "", decimals: 2 },
        { iso: "MVR", name: "Maldivian rufiyaa", format: "", decimals: 2 },
        { iso: "MWK", name: "Malawian kwacha", format: "", decimals: 2 },
        { iso: "MXN", name: "Mexican peso", format: "", decimals: 2 },
        { iso: "MYR", name: "Malaysian ringgit", format: "", decimals: 2 },
        { iso: "MZN", name: "Mozambican metical", format: "", decimals: 2 },
        { iso: "NAD", name: "Namibian dollar", format: "", decimals: 2 },
        { iso: "NGN", name: "Nigerian naira", format: "", decimals: 2 },
        { iso: "NIO", name: "Nicaraguan córdoba", format: "", decimals: 2 },
        { iso: "NOK", name: "Norwegian krone", format: "* NKr", decimals: 2 },
        { iso: "NPR", name: "Nepalese rupee", format: "", decimals: 2 },
        { iso: "NZD", name: "New Zealand dollar", format: "NZ$*", decimals: 2 },
        { iso: "OMR", name: "Omani rial", format: "", decimals: 3 },
        { iso: "PAB", name: "Panamanian balboa", format: "", decimals: 2 },
        { iso: "PEN", name: "Peruvian sol", format: "", decimals: 2 },
        { iso: "PGK", name: "Papua New Guinean kina", format: "", decimals: 2 },
        { iso: "PHP", name: "Philippine peso", format: "", decimals: 2 },
        { iso: "PKR", name: "Pakistani rupee", format: "", decimals: 2 },
        { iso: "PLN", name: "Polish złoty", format: "", decimals: 2 },
        { iso: "PYG", name: "Paraguayan guaraní", format: "", decimals: 0 },
        { iso: "QAR", name: "Qatari riyal", format: "", decimals: 2 },
        { iso: "RON", name: "Romanian leu", format: "", decimals: 2 },
        { iso: "RSD", name: "Serbian dinar", format: "", decimals: 2 },
        { iso: "RUB", name: "Russian ruble", format: "", decimals: 2 },
        { iso: "RWF", name: "Rwandan franc", format: "", decimals: 0 },
        { iso: "SAR", name: "Saudi riyal", format: "", decimals: 2 },
        { iso: "SBD", name: "Solomon Islands dollar", format: "", decimals: 2 },
        { iso: "SCR", name: "Seychelles rupee", format: "", decimals: 2 },
        { iso: "SDG", name: "Sudanese pound", format: "", decimals: 2 },
        { iso: "SEK", name: "Swedish krona", format: "* SKr", decimals: 2 },
        { iso: "SGD", name: "Singapore dollar", format: "", decimals: 2 },
        { iso: "SHP", name: "Saint Helena pound", format: "", decimals: 2 },
        { iso: "SLE", name: "Sierra Leonean leone (new leone)", format: "", decimals: 2 },
        { iso: "SLL", name: "Sierra Leonean leone (old leone)", format: "", decimals: 2 },
        { iso: "SOS", name: "Somali shilling", format: "", decimals: 2 },
        { iso: "SRD", name: "Surinamese dollar", format: "", decimals: 2 },
        { iso: "SSP", name: "South Sudanese pound", format: "", decimals: 2 },
        { iso: "STN", name: "São Tomé and Príncipe dobra", format: "", decimals: 2 },
        { iso: "SVC", name: "Salvadoran colón", format: "", decimals: 2 },
        { iso: "SYP", name: "Syrian pound", format: "", decimals: 2 },
        { iso: "SZL", name: "Swazi lilangeni", format: "", decimals: 2 },
        { iso: "THB", name: "Thai baht", format: "฿*", decimals: 2 },
        { iso: "TJS", name: "Tajikistani somoni", format: "", decimals: 2 },
        { iso: "TMT", name: "Turkmenistan manat", format: "", decimals: 2 },
        { iso: "TND", name: "Tunisian dinar", format: "", decimals: 3 },
        { iso: "TOP", name: "Tongan pa'anga", format: "", decimals: 2 },
        { iso: "TRY", name: "Turkish lira", format: "", decimals: 2 },
        { iso: "TTD", name: "Trinidad and Tobago dollar", format: "", decimals: 2 },
        { iso: "TWD", name: "New Taiwan dollar", format: "", decimals: 2 },
        { iso: "TZS", name: "Tanzanian shilling", format: "", decimals: 2 },
        { iso: "UAH", name: "Ukrainian hryvnia", format: "", decimals: 2 },
        { iso: "UGX", name: "Ugandan shilling", format: "", decimals: 0 },
        { iso: "USD", name: "United States dollar", format: "$*", decimals: 2 },
        { iso: "UYU", name: "Uruguayan peso", format: "", decimals: 2 },
        { iso: "UYW", name: "Unidad previsional", format: "", decimals: 4 },
        { iso: "UZS", name: "Uzbekistan sum", format: "", decimals: 2 },
        { iso: "VED", name: "Venezuelan digital bolívar", format: "", decimals: 2 },
        { iso: "VES", name: "Venezuelan sovereign bolívar", format: "", decimals: 2 },
        { iso: "VND", name: "Vietnamese đồng", format: "", decimals: 0 },
        { iso: "VUV", name: "Vanuatu vatu", format: "", decimals: 0 },
        { iso: "WST", name: "Samoan tala", format: "", decimals: 2 },
        { iso: "XCD", name: "East Caribbean dollar", format: "", decimals: 2 },
        { iso: "YER", name: "Yemeni rial", format: "", decimals: 2 },
        { iso: "ZAR", name: "South African rand", format: "", decimals: 2 },
        { iso: "ZMW", name: "Zambian kwacha", format: "", decimals: 2 },
        { iso: "ZWL", name: "Zimbabwean dollar", format: "", decimals: 2 },
    ];
    public static getCurrencies()
    {
        return Currencies.currencies;
    }
    public static getCurrency(iso: string)
    {
        return Currencies.currencies.find(c => c.iso === iso);
    }
    public static formatAmount(amount: number | string, iso: string)
    {
        const currency = Currencies.currencies.find(c => c.iso === iso);
        const format = currency?.format && currency.format.includes("*") ? currency.format : `* ${iso}`;
        const locale = currency?.locale ?? "en-US";
        return format.split("*").join(Currencies.parse(amount, iso).toLocaleString(locale));
    }
    public static smallestUnit(iso: string)
    {
        const currency = Currencies.currencies.find(c => c.iso === iso);
        if (!currency) return 0.01;
        return 0.1 ** currency.decimals;
    }
    public static parse(amount: number | string, iso: string, decimalsOverride = -1)
    {
        if (typeof amount === "string") amount = parseFloat(amount);
        if (Number.isNaN(amount)) amount = 0;
        const currency = Currencies.currencies.find(c => c.iso === iso);
        if (!currency) return amount;
        if (decimalsOverride < 0) decimalsOverride = currency.decimals;
        return Numbers.round(amount, decimalsOverride);
    }
    public static appromixatelySame(a: number | string, b: number | string, iso: string)
    {
        a = Currencies.parse(a, iso);
        b = Currencies.parse(b, iso);
        const currency = Currencies.currencies.find(c => c.iso === iso);
        if (!currency) return a === b;
        const min = this.smallestUnit(iso) * 2;
        return Math.abs(a - b) <= min;
    }
}
