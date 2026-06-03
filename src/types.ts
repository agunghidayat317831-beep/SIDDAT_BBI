export type BBILocation = "Cipule" | "Mekarbuana";
export type FishCommodity = "Ikan Mas" | "Nila" | "Lele";
export type SizeCategory = "1-3 cm" | "3-5 cm" | "Indukan";
export type LogisticsType = "Produksi" | "Penjualan" | "Penyetokan Ulang" | "Hibah" | "Kematian Ikan";
export type FlowType = "Masuk" | "Keluar";

export interface LogisticsEntry {
  id: string;
  location: BBILocation;
  commodity: FishCommodity;
  size: SizeCategory;
  type: LogisticsType;
  flow: FlowType;
  month: string; // "Minggu ke 1" - "Minggu ke 52"
  quantity: number;
  unit: "ekor" | "kg";
  createdAt: number;
  userId: string;
  padReceiptImage?: string;
  farmerId?: string;
  farmerName?: string;
  farmerLocation?: string;
}

export interface PHRecord {
  id: string;
  week: string;
  location: BBILocation;
  phValue: number;
  notes?: string;
  createdAt: number;
  userId: string;
}

export interface OxygenRecord {
  id: string;
  week: string;
  location: BBILocation;
  oxygenValue: number;
  notes?: string;
  createdAt: number;
  userId: string;
}

export interface Farmer {
  id: string;
  kecamatan: string;
  desa: string;
  namaPenanggungjawab: string;
  kegiatanUsaha: string;
  email: string;
  telephone: string;
  klasifikasiKolam: string;
  teknologiBudidaya: string;
  bentukUsaha: string;
  statusProfesi: string;
  statusKepemilikan: string;
  periodeSewa: string;
  jenisIkanUtama: string;
  jenisIkanTambahan: string;
  omzet: number;
  alamat: string;
  latitude: number;
  longitude: number;
  createdAt: number;
  userId: string;
  photoUrl?: string;
}

export interface Tpi {
  id: string;
  namaTpi: string;
  kecamatan: string;
  desa: string;
  alamat: string;
  latitude: number;
  longitude: number;
  keterangan: string;
  createdAt: number;
  userId: string;
}

export const WEEKS = Array.from({ length: 52 }, (_, i) => `Minggu ke ${i + 1}`);

export const LOCATIONS: BBILocation[] = ["Cipule", "Mekarbuana"];
export const COMMODITIES: FishCommodity[] = ["Ikan Mas", "Nila", "Lele"];
export const SIZES: SizeCategory[] = ["1-3 cm", "3-5 cm", "Indukan"];
export const TYPES: { name: LogisticsType; flow: FlowType }[] = [
  { name: "Produksi", flow: "Masuk" },
  { name: "Penyetokan Ulang", flow: "Masuk" },
  { name: "Penjualan", flow: "Keluar" },
  { name: "Hibah", flow: "Keluar" },
  { name: "Kematian Ikan", flow: "Keluar" },
];

export const KECAMATAN_DESA: Record<string, string[]> = {
  "Kecamatan Banyusari": [
    "Desa Banyuasih", "Desa Cicinde Selatan", "Desa Cicinde Utara", "Desa Gembongan",
    "Desa Gempol", "Desa Gempolkolot", "Desa Jayamukti", "Desa Kutaraharja",
    "Desa Mekarasih", "Desa Pamekaran", "Desa Talunjaya", "Desa Tanjung"
  ],
  "Kecamatan Batujaya": [
    "Desa Batujaya", "Desa Baturaden", "Desa Karyabakti", "Desa Karyamakmur",
    "Desa Karyamulya", "Desa Kutaampel", "Desa Segaran", "Desa Segarjaya",
    "Desa Telukambulu", "Desa Telukbango"
  ],
  "Kecamatan Ciampel": [
    "Desa Kutamekar", "Desa Kutanegara", "Desa Kutapohaci", "Desa Mulyasari",
    "Desa Mulyasejati", "Desa Parungmulya", "Desa Tegalega"
  ],
  "Kecamatan Cibuaya": [
    "Desa Cemarajaya", "Desa Cibuaya", "Desa Gebangjaya", "Desa Jayamulya",
    "Desa Kalidungjaya", "Desa Kedungjaya", "Desa Kedungjeruk", "Desa Kertarahayu",
    "Desa Pejaten", "Desa Sedari", "Desa Sukasari"
  ],
  "Kecamatan Cikampek": [
    "Desa Cikampek Barat", "Desa Cikampek Kota", "Desa Cikampek Pusaka",
    "Desa Cikampek Selatan", "Desa Cikampek Timur", "Desa Dawuan Barat",
    "Desa Dawuan Tengah", "Desa Dawuan Timur", "Desa Kalihurip", "Desa Kamojing"
  ],
  "Kecamatan Cilamaya Kulon": [
    "Desa Bayur Kidul", "Desa Bayur Lor", "Desa Kiara", "Desa Langensari",
    "Desa Manggungjaya", "Desa Muktijaya", "Desa Pasirjaya", "Desa Pasirukem",
    "Desa Sukajaya", "Desa Sukamulya", "Desa Sumurgede", "Desa Tegalurung"
  ],
  "Kecamatan Cilamaya Wetan": [
    "Desa Cikalong", "Desa Cikarang", "Desa Cilamaya", "Desa Mekarmaya",
    "Desa Muara", "Desa Muarabaru", "Desa Rawagempol Kulon", "Desa Rawagempol Wetan",
    "Desa Sukakerta", "Desa Sukatani", "Desa Tegalsari", "Desa Tegalwaru"
  ],
  "Kecamatan Cilebar": [
    "Desa Cikande", "Desa Ciptamargi", "Desa Kertamukti", "Desa Kosambibatu",
    "Desa Mekarpohaci", "Desa Pusakajaya Selatan", "Desa Pusakajaya Utara",
    "Desa Rawasari", "Desa Sukaratu", "Desa Tanjungsari"
  ],
  "Kecamatan Jatisari": [
    "Desa Balonggandu", "Desa Barugbug", "Desa Cikalongsari", "Desa Cirejag",
    "Desa Jatibaru", "Desa Jatiragas", "Desa Jatisari", "Desa Jatiwangi",
    "Desa Kalijati", "Desa Mekarsari", "Desa Pacing", "Desa Situdam",
    "Desa Sukamekar", "Desa Telarsari"
  ],
  "Kecamatan Jayakerta": [
    "Desa Ciptamarga", "Desa Jayakerta", "Desa Jayamakmur", "Desa Kampungsawah",
    "Desa Kemiri", "Desa Kertajaya", "Desa Makmurjaya", "Desa Medangasem"
  ],
  "Kecamatan Karawang Barat": [
    "Kelurahan Adiarsa Barat", "Kelurahan Karangpawitan", "Kelurahan Karawang Kulon",
    "Kelurahan Mekarjati", "Kelurahan Nagasari", "Kelurahan Tanjungmekar",
    "Kelurahan Tanjungpura", "Kelurahan Tunggakjati"
  ],
  "Kecamatan Karawang Timur": [
    "Desa Kondangjaya", "Desa Margasari", "Desa Tegalsawah", "Desa Warungbambu",
    "Kelurahan Adiarsa Timur", "Kelurahan Karawang Wetan", "Kelurahan Palumbonsari",
    "Kelurahan Plawad"
  ],
  "Kecamatan Klari": [
    "Anggadita", "Belendung", "Cibalongsari", "Cimahi", "Curug", "Duren",
    "Gintungkerta", "Karanganyar", "Kiarapayung", "Klari", "Pancawati",
    "Sumurkondang", "Walahar"
  ],
  "Kecamatan Kotabaru": [
    "Cikampek Utara", "Jomin Barat", "Jomin Timur", "Pangulah Baru",
    "Pangulah Selatan", "Pangulah Utara", "Pucung", "Sarimulya", "Wancimekar"
  ],
  "Kecamatan Kutawaluya": [
    "Kutagandok", "Kutajaya", "Kutakarya", "Kutamukti", "Kutaraja", "Mulyajaya",
    "Sampalan", "Sindangkarya", "Sindangmukti", "Sindangmulya", "Sindangsari", "Waluya"
  ],
  "Kecamatan Lemahabang": [
    "Ciwaringin", "Karangtanjung", "Karyamukti", "Kedawung", "Lemahabang",
    "Lemahmukti", "Pasirtanjung", "Pulojaya", "Pulokalapa", "Pulomulya", "Waringinkarya"
  ],
  "Kecamatan Majalaya": [
    "Bengle", "Ciranggon", "Lemahmulya", "Majalaya", "Pasirjengkol", "Pasirmulya", "Sarijaya"
  ],
  "Kecamatan Pakisjaya": [
    "Solokan", "Talagajaya", "Tanahbaru", "Tanjungbungin", "Tanjungmekar",
    "Tanjungpakis", "Telukbuyung", "Telukjaya"
  ],
  "Kecamatan Pangkalan": [
    "Cintaasih", "Ciptasari", "Jatilaksana", "Kertasari", "Medalsari",
    "Mulangsari", "Tamanmekar", "Tamansari"
  ],
  "Kecamatan Pedes": [
    "Dongkal", "Jatimulya", "Karangjaya", "Kedaljaya", "Kertamulya", "Kertaraharja",
    "Labanjaya", "Malangsari", "Payungsari", "Puspasari", "Randumulya", "Sungaibuntu"
  ],
  "Kecamatan Purwasari": [
    "Cengkong", "Darawolong", "Karangsari", "Mekarjaya", "Purwasari", "Sukasari",
    "Tamelang", "Tegalsari"
  ],
  "Kecamatan Rawamerta": [
    "Balongsari", "Cibadak", "Gombongsari", "Kutawargi", "Mekarjaya", "Panyingkiran",
    "Pasirawi", "Pasirkaliki", "Purwamekar", "Sekarwangi", "Sukamerta", "Sukapura", "Sukaraja"
  ],
  "Kecamatan Rengasdengklok": [
    "Amansari", "Dewisari", "Dukuhkarya", "Kalangsari", "Kalangsuria", "Karyasari",
    "Kertasari", "Rengasdengklok Selatan", "Rengasdengklok Utara"
  ],
  "Kecamatan Tegalwaru": [
    "Cigunungsari", "Cintalaksana", "Cintalanggeng", "Cintawargi", "Cipurwasari",
    "Kutalanggeng", "Kutamaneuh", "Mekarbuana", "Wargasetra"
  ],
  "Kecamatan Telagasari": [
    "Cadaskertajaya", "Cariumulya", "Cilewo", "Ciwulan", "Kalibuaya", "Kalijaya",
    "Kalisari", "Linggarsari", "Pasirkamuning", "Pasirmukti", "Pasirtalaga",
    "Pulosari", "Talagamulya", "Talagasari"
  ],
  "Kecamatan Telukjambe Barat": [
    "Karangligar", "Karangmulya", "Margakaya", "Margamulya", "Mekarmulya",
    "Mulyajaya", "Parungsari", "Wanajaya", "Wanakerta", "Wanasari"
  ],
  "Kecamatan Telukjambe Timur": [
    "Pinayungan", "Purwadana", "Puseurjaya", "Sirnabaya", "Sukaharja", "Sukaluyu",
    "Sukamakmur", "Telukjambe", "Wadas"
  ],
  "Kecamatan Tempuran": [
    "Cikuntul", "Ciparagejaya", "Dayeuhluhur", "Jayanagara", "Lemahduhur",
    "Lemahkarya", "Lemahmakmur", "Lemahsubur", "Pagadungan", "Pancakarya",
    "Purwajaya", "Sumberjaya", "Tanjungjaya", "Tempuran"
  ],
  "Kecamatan Tirtajaya": [
    "Bolang", "Gempolkarya", "Kutamakmur", "Medankarya", "Pisangsambo", "Sabajaya",
    "Srijaya", "Srikamulyan", "Sumurlaban", "Tambaksari", "Tambaksumur"
  ],
  "Kecamatan Tirtamulya": [
    "Bojongsari", "Cipondoh", "Citarik", "Kamurang", "Karangjaya", "Karangsinom",
    "Kertawaluya", "Parakan", "Parakanmulya", "Tirtasari"
  ]
};

export const KECAMATAN = Object.keys(KECAMATAN_DESA);

export const KEGIATAN_USAHA = [
  "Budidaya Ikan",
  "Pembenihan Ikan",
  "Pembesaran Ikan"
];

export const KLASIFIKASI_KOLAM = [
  "Budidaya Ikan Hias Tawar",
  "Jaring Apung Tawar",
  "Jaring Tancap Tawar",
  "Karamba",
  "Kolam Air Deras",
  "Kolam Air Tenang",
  "Pembenihan dan Pendederan Air Payau",
  "Pembenihan dan Pendederan Air Tawar",
  "Pembenihan dan Pendederan Air Laut",
  "Rumput Laut",
  "Tambak Intensif",
  "Tambak Sederhana",
  "Tambak Semi Intensif"
];

export const TEKNOLOGI_BUDIDAYA = [
  "Bioflok",
  "Intensif",
  "Sederhana",
  "Semi Intensif"
];

export const STATUS_KEPEMILIKAN = [
  "Kerjasama/Bagi Hasil",
  "Milik Sendiri",
  "Sewa/Milik Mitra"
];

export const STATUS_PROFESI = [
  "Utama",
  "Sampingan"
];

export const BENTUK_USAHA = [
  "Perseorangan",
  "Kelompok",
  "Badan Usaha"
];
