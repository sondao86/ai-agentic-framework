export interface BibleBook {
  abbr: string; // English abbreviation
  abbrVi: string; // Vietnamese abbreviation
  name: string; // English name
  nameVi: string; // Vietnamese name
  chapters: number;
  testament: "OT" | "NT";
  scanTier: 1 | 2 | 3;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // --- Old Testament (Tier 3) ---
  { abbr: "Gen", abbrVi: "St", name: "Genesis", nameVi: "Sáng Thế", chapters: 50, testament: "OT", scanTier: 3 },
  { abbr: "Exod", abbrVi: "Xh", name: "Exodus", nameVi: "Xuất Hành", chapters: 40, testament: "OT", scanTier: 3 },
  { abbr: "Lev", abbrVi: "Lv", name: "Leviticus", nameVi: "Lêvi", chapters: 27, testament: "OT", scanTier: 3 },
  { abbr: "Num", abbrVi: "Ds", name: "Numbers", nameVi: "Dân Số", chapters: 36, testament: "OT", scanTier: 3 },
  { abbr: "Deut", abbrVi: "Đnl", name: "Deuteronomy", nameVi: "Đệ Nhị Luật", chapters: 34, testament: "OT", scanTier: 3 },
  { abbr: "Josh", abbrVi: "Gs", name: "Joshua", nameVi: "Giôsuê", chapters: 24, testament: "OT", scanTier: 3 },
  { abbr: "Judg", abbrVi: "Tl", name: "Judges", nameVi: "Thủ Lãnh", chapters: 21, testament: "OT", scanTier: 3 },
  { abbr: "Ruth", abbrVi: "R", name: "Ruth", nameVi: "Rút", chapters: 4, testament: "OT", scanTier: 3 },
  { abbr: "1Sam", abbrVi: "1Sm", name: "1 Samuel", nameVi: "1 Samuel", chapters: 31, testament: "OT", scanTier: 3 },
  { abbr: "2Sam", abbrVi: "2Sm", name: "2 Samuel", nameVi: "2 Samuel", chapters: 24, testament: "OT", scanTier: 3 },
  { abbr: "1Kgs", abbrVi: "1V", name: "1 Kings", nameVi: "1 Các Vua", chapters: 22, testament: "OT", scanTier: 3 },
  { abbr: "2Kgs", abbrVi: "2V", name: "2 Kings", nameVi: "2 Các Vua", chapters: 25, testament: "OT", scanTier: 3 },
  { abbr: "1Chr", abbrVi: "1Sb", name: "1 Chronicles", nameVi: "1 Sử Biên", chapters: 29, testament: "OT", scanTier: 3 },
  { abbr: "2Chr", abbrVi: "2Sb", name: "2 Chronicles", nameVi: "2 Sử Biên", chapters: 36, testament: "OT", scanTier: 3 },
  { abbr: "Ezra", abbrVi: "Er", name: "Ezra", nameVi: "Ét-ra", chapters: 10, testament: "OT", scanTier: 3 },
  { abbr: "Neh", abbrVi: "Nkm", name: "Nehemiah", nameVi: "Nơkhemia", chapters: 13, testament: "OT", scanTier: 3 },
  { abbr: "Tob", abbrVi: "Tb", name: "Tobit", nameVi: "Tôbia", chapters: 14, testament: "OT", scanTier: 3 },
  { abbr: "Jdt", abbrVi: "Gđt", name: "Judith", nameVi: "Giuđitha", chapters: 16, testament: "OT", scanTier: 3 },
  { abbr: "Esth", abbrVi: "Et", name: "Esther", nameVi: "Étte", chapters: 10, testament: "OT", scanTier: 3 },
  { abbr: "1Macc", abbrVi: "1Mcb", name: "1 Maccabees", nameVi: "1 Macabê", chapters: 16, testament: "OT", scanTier: 3 },
  { abbr: "2Macc", abbrVi: "2Mcb", name: "2 Maccabees", nameVi: "2 Macabê", chapters: 15, testament: "OT", scanTier: 3 },
  { abbr: "Job", abbrVi: "G", name: "Job", nameVi: "Gióp", chapters: 42, testament: "OT", scanTier: 3 },
  { abbr: "Ps", abbrVi: "Tv", name: "Psalms", nameVi: "Thánh Vịnh", chapters: 150, testament: "OT", scanTier: 3 },
  { abbr: "Prov", abbrVi: "Cn", name: "Proverbs", nameVi: "Châm Ngôn", chapters: 31, testament: "OT", scanTier: 3 },
  { abbr: "Eccl", abbrVi: "Gv", name: "Ecclesiastes", nameVi: "Giảng Viên", chapters: 12, testament: "OT", scanTier: 3 },
  { abbr: "Song", abbrVi: "Dc", name: "Song of Songs", nameVi: "Diễm Ca", chapters: 8, testament: "OT", scanTier: 3 },
  { abbr: "Wis", abbrVi: "Kn", name: "Wisdom", nameVi: "Khôn Ngoan", chapters: 19, testament: "OT", scanTier: 3 },
  { abbr: "Sir", abbrVi: "Hc", name: "Sirach", nameVi: "Huấn Ca", chapters: 51, testament: "OT", scanTier: 3 },
  { abbr: "Isa", abbrVi: "Is", name: "Isaiah", nameVi: "Isaia", chapters: 66, testament: "OT", scanTier: 3 },
  { abbr: "Jer", abbrVi: "Gr", name: "Jeremiah", nameVi: "Giêrêmia", chapters: 52, testament: "OT", scanTier: 3 },
  { abbr: "Lam", abbrVi: "Ac", name: "Lamentations", nameVi: "Ai Ca", chapters: 5, testament: "OT", scanTier: 3 },
  { abbr: "Bar", abbrVi: "Br", name: "Baruch", nameVi: "Barúc", chapters: 6, testament: "OT", scanTier: 3 },
  { abbr: "Ezek", abbrVi: "Ed", name: "Ezekiel", nameVi: "Êdêkien", chapters: 48, testament: "OT", scanTier: 3 },
  { abbr: "Dan", abbrVi: "Đn", name: "Daniel", nameVi: "Đanien", chapters: 14, testament: "OT", scanTier: 3 },
  { abbr: "Hos", abbrVi: "Hs", name: "Hosea", nameVi: "Hôsê", chapters: 14, testament: "OT", scanTier: 3 },
  { abbr: "Joel", abbrVi: "Ge", name: "Joel", nameVi: "Gioen", chapters: 4, testament: "OT", scanTier: 3 },
  { abbr: "Amos", abbrVi: "Am", name: "Amos", nameVi: "Amốt", chapters: 9, testament: "OT", scanTier: 3 },
  { abbr: "Obad", abbrVi: "Ôv", name: "Obadiah", nameVi: "Ôvađia", chapters: 1, testament: "OT", scanTier: 3 },
  { abbr: "Jonah", abbrVi: "Gn", name: "Jonah", nameVi: "Giôna", chapters: 4, testament: "OT", scanTier: 3 },
  { abbr: "Mic", abbrVi: "Mk", name: "Micah", nameVi: "Mikha", chapters: 7, testament: "OT", scanTier: 3 },
  { abbr: "Nah", abbrVi: "Nk", name: "Nahum", nameVi: "Nakhum", chapters: 3, testament: "OT", scanTier: 3 },
  { abbr: "Hab", abbrVi: "Kb", name: "Habakkuk", nameVi: "Khabacúc", chapters: 3, testament: "OT", scanTier: 3 },
  { abbr: "Zeph", abbrVi: "Xp", name: "Zephaniah", nameVi: "Xôphônia", chapters: 3, testament: "OT", scanTier: 3 },
  { abbr: "Hag", abbrVi: "Kg", name: "Haggai", nameVi: "Khácgai", chapters: 2, testament: "OT", scanTier: 3 },
  { abbr: "Zech", abbrVi: "Dcr", name: "Zechariah", nameVi: "Dacaria", chapters: 14, testament: "OT", scanTier: 3 },
  { abbr: "Mal", abbrVi: "Ml", name: "Malachi", nameVi: "Malakhi", chapters: 3, testament: "OT", scanTier: 3 },

  // --- New Testament ---
  // Tier 1: 4 Gospels
  { abbr: "Matt", abbrVi: "Mt", name: "Matthew", nameVi: "Mátthêu", chapters: 28, testament: "NT", scanTier: 1 },
  { abbr: "Mark", abbrVi: "Mc", name: "Mark", nameVi: "Máccô", chapters: 16, testament: "NT", scanTier: 1 },
  { abbr: "Luke", abbrVi: "Lc", name: "Luke", nameVi: "Luca", chapters: 24, testament: "NT", scanTier: 1 },
  { abbr: "John", abbrVi: "Ga", name: "John", nameVi: "Gioan", chapters: 21, testament: "NT", scanTier: 1 },

  // Tier 2: Acts
  { abbr: "Acts", abbrVi: "Cv", name: "Acts", nameVi: "Công Vụ", chapters: 28, testament: "NT", scanTier: 2 },

  // Tier 1: Pauline Epistles
  { abbr: "Rom", abbrVi: "Rm", name: "Romans", nameVi: "Rôma", chapters: 16, testament: "NT", scanTier: 1 },
  { abbr: "1Cor", abbrVi: "1Cr", name: "1 Corinthians", nameVi: "1 Côrintô", chapters: 16, testament: "NT", scanTier: 1 },
  { abbr: "2Cor", abbrVi: "2Cr", name: "2 Corinthians", nameVi: "2 Côrintô", chapters: 13, testament: "NT", scanTier: 1 },
  { abbr: "Gal", abbrVi: "Gl", name: "Galatians", nameVi: "Galát", chapters: 6, testament: "NT", scanTier: 1 },
  { abbr: "Eph", abbrVi: "Ep", name: "Ephesians", nameVi: "Êphêsô", chapters: 6, testament: "NT", scanTier: 1 },
  { abbr: "Phil", abbrVi: "Pl", name: "Philippians", nameVi: "Philípphê", chapters: 4, testament: "NT", scanTier: 1 },
  { abbr: "Col", abbrVi: "Cl", name: "Colossians", nameVi: "Côlôxê", chapters: 4, testament: "NT", scanTier: 1 },
  { abbr: "1Thess", abbrVi: "1Tx", name: "1 Thessalonians", nameVi: "1 Thêxalônica", chapters: 5, testament: "NT", scanTier: 1 },
  { abbr: "2Thess", abbrVi: "2Tx", name: "2 Thessalonians", nameVi: "2 Thêxalônica", chapters: 3, testament: "NT", scanTier: 1 },
  { abbr: "1Tim", abbrVi: "1Tm", name: "1 Timothy", nameVi: "1 Timôthê", chapters: 6, testament: "NT", scanTier: 1 },
  { abbr: "2Tim", abbrVi: "2Tm", name: "2 Timothy", nameVi: "2 Timôthê", chapters: 4, testament: "NT", scanTier: 1 },
  { abbr: "Titus", abbrVi: "Tt", name: "Titus", nameVi: "Titô", chapters: 3, testament: "NT", scanTier: 1 },
  { abbr: "Phlm", abbrVi: "Plm", name: "Philemon", nameVi: "Philêmôn", chapters: 1, testament: "NT", scanTier: 1 },

  // Tier 2: Other NT
  { abbr: "Heb", abbrVi: "Dt", name: "Hebrews", nameVi: "Do Thái", chapters: 13, testament: "NT", scanTier: 2 },
  { abbr: "Jas", abbrVi: "Gc", name: "James", nameVi: "Giacôbê", chapters: 5, testament: "NT", scanTier: 2 },
  { abbr: "1Pet", abbrVi: "1Pr", name: "1 Peter", nameVi: "1 Phêrô", chapters: 5, testament: "NT", scanTier: 2 },
  { abbr: "2Pet", abbrVi: "2Pr", name: "2 Peter", nameVi: "2 Phêrô", chapters: 3, testament: "NT", scanTier: 2 },
  { abbr: "1John", abbrVi: "1Ga", name: "1 John", nameVi: "1 Gioan", chapters: 5, testament: "NT", scanTier: 2 },
  { abbr: "2John", abbrVi: "2Ga", name: "2 John", nameVi: "2 Gioan", chapters: 1, testament: "NT", scanTier: 2 },
  { abbr: "3John", abbrVi: "3Ga", name: "3 John", nameVi: "3 Gioan", chapters: 1, testament: "NT", scanTier: 2 },
  { abbr: "Jude", abbrVi: "Gđ", name: "Jude", nameVi: "Giuđa", chapters: 1, testament: "NT", scanTier: 2 },
  { abbr: "Rev", abbrVi: "Kh", name: "Revelation", nameVi: "Khải Huyền", chapters: 22, testament: "NT", scanTier: 2 },
];

/** Find a book by English abbreviation, Vietnamese abbreviation, or name */
export function findBook(query: string): BibleBook | undefined {
  const q = query.trim();
  return BIBLE_BOOKS.find(
    (b) =>
      b.abbr.toLowerCase() === q.toLowerCase() ||
      b.abbrVi.toLowerCase() === q.toLowerCase() ||
      b.name.toLowerCase() === q.toLowerCase() ||
      b.nameVi.toLowerCase() === q.toLowerCase()
  );
}

/** Get all books in a specific scan tier */
export function getBooksByTier(tier: 1 | 2 | 3): BibleBook[] {
  return BIBLE_BOOKS.filter((b) => b.scanTier === tier);
}

/** Get total chapter count for a set of books */
export function getTotalChapters(books: BibleBook[]): number {
  return books.reduce((sum, b) => sum + b.chapters, 0);
}
