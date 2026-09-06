import * as fs from 'fs';
import * as path from 'path';

/**
 * format-csv.ts
 * -------------
 * Parses the raw Agmarknet "Marketwise Price Report" CSV (single day snapshot)
 * and emits a clean, typed JSON snapshot at `backend/csv/formated.json`.
 *
 * Expected header (row 1):
 *   State,District,Market,Commodity,Variety,Grade,Arrival_Date,
 *   Min_x0020_Price,Max_x0020_Price,Modal_x0020_Price
 *
 * Prices are integers in Rs./Quintal. Dates are DD/MM/YYYY and are normalized to
 * YYYY-MM-DD. Fields may be double-quoted with embedded commas or escaped quotes
 * (RFC-4180), and some cells carry stray whitespace / trailing newlines — all
 * string fields are trimmed. Every data row is preserved for full meaning.
 *
 * Usage: `npm run format-csv` (runs via tsx from the backend/ directory).
 */

const CSV_DIR = path.join(process.cwd(), 'csv');
const OUT_FILE = path.join(CSV_DIR, 'formated.json');

/** Exact header -> JSON key mapping for the marketwise report. */
const HEADER_MAP: Record<string, string> = {
  State: 'state',
  District: 'district',
  Market: 'market',
  Commodity: 'commodity',
  Variety: 'variety',
  Grade: 'grade',
  Arrival_Date: 'date',
  Min_x0020_Price: 'minPrice',
  Max_x0020_Price: 'maxPrice',
  Modal_x0020_Price: 'modalPrice',
};

/**
 * Minimal RFC-4180-style CSV parser: handles double-quoted fields (including
 * embedded commas and newlines), "" escaped quotes, and \r\n / \n endings.
 * Returns rows of raw (untrimmed) fields.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      if (field.endsWith('\r')) field = field.slice(0, -1);
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    if (field.endsWith('\r')) field = field.slice(0, -1);
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Normalize "DD/MM/YYYY" -> "YYYY-MM-DD". Throws on anything else. */
function normalizeDate(raw: string): string {
  const t = raw.trim();
  const m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) throw new Error(`Unrecognized Arrival_Date "${raw}" (expected DD/MM/YYYY)`);
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Coerce a price cell to an integer. Non-numeric cells abort (all rows present). */
function toPrice(raw: string): number {
  const t = raw.trim();
  const n = Number(t);
  if (!Number.isFinite(n)) throw new Error(`Non-numeric price cell "${raw}"`);
  return n;
}

interface Row {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

function main(): void {
  const files = fs.readdirSync(CSV_DIR).filter((f) => /\.csv$/i.test(f)).sort();
  if (files.length === 0) {
    throw new Error(`No CSV files found in ${CSV_DIR}`);
  }
  if (files.length > 1) {
    console.log(`Found ${files.length} CSVs; using the first: ${files[0]}`);
  }
  const csvFile = files[0];

  const parsed = parseCsv(fs.readFileSync(path.join(CSV_DIR, csvFile), 'utf8'));
  if (parsed.length < 2) {
    throw new Error(`CSV ${csvFile} has no data rows (got ${parsed.length} rows)`);
  }

  // Header row 1. Map each column index to a JSON key; reject unknown columns.
  const headers = parsed[0].map((h) => h.trim());
  const colKeys: (keyof Row | undefined)[] = headers.map((h) => HEADER_MAP[h] as keyof Row | undefined);
  for (let i = 0; i < headers.length; i++) {
    if (!colKeys[i]) throw new Error(`Unmapped CSV header "${headers[i]}" (column ${i + 1})`);
  }

  const rows: Row[] = parsed.slice(1).map((cells) => {
    const rec: Partial<Record<keyof Row, unknown>> = {};
    for (let i = 0; i < cells.length && i < colKeys.length; i++) {
      const key = colKeys[i]!;
      const cell = cells[i];
      rec[key] =
        key === 'date'
          ? normalizeDate(cell)
          : key === 'minPrice' || key === 'maxPrice' || key === 'modalPrice'
            ? toPrice(cell)
            : cell.trim();
    }
    return rec as unknown as Row;
  });

  rows.sort(
    (a, b) =>
      cmpStr(a.state, b.state) ||
      cmpStr(a.district, b.district) ||
      cmpStr(a.market, b.market) ||
      cmpStr(a.commodity, b.commodity) ||
      cmpStr(a.variety, b.variety) ||
      cmpStr(a.grade, b.grade)
  );

  const dates = new Set(rows.map((r) => r.date));
  if (dates.size !== 1) {
    throw new Error(`Expected a single Arrival_Date but found: ${[...dates].join(', ')}`);
  }

  const commodities = new Set(rows.map((r) => r.commodity));
  const markets = new Set(rows.map((r) => `${r.state}|${r.district}|${r.market}`));

  const output = {
    source: csvFile,
    date: [...dates][0],
    recordCount: rows.length,
    commodityCount: commodities.size,
    marketCount: markets.size,
    rows,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log(`formatted ${csvFile} -> ${OUT_FILE}`);
  console.log(`  date: ${output.date}, rows: ${output.recordCount}`);
  console.log(`  commodities: ${output.commodityCount}, markets: ${output.marketCount}`);
}

main();