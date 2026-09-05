import * as fs from 'fs';
import * as path from 'path';

/**
 * format-csv.ts
 * -------------
 * Parses the raw Agmarknet "Marketwise Price & Arrival Report" CSV downloaded from
 * data.gov.in (see csv/DATA-SOURCE notes) and emits a clean, typed JSON snapshot at
 * `backend/csv/formated.json`.
 *
 * The report is a national modal-price/arrival report (Rs./Quintal & Metric Tonnes).
 * Generated file shape:
 *   {
 *     reportTitle: string,
 *     reportDate:  string,            // YYYY-MM-DD
 *     commodities: [{
 *       commodityGroup,
 *       commodity,
 *       msp,                          // number | null
 *       priceOnDDMmmYYYY,             // number | null
 *       arrivalOnDDMmmYYYY,           // number | null
 *     }]
 *   }
 *
 * Usage: `npm run format-csv` (runs via tsx from the backend/ directory).
 */

const CSV_DIR = path.join(__dirname, '..', 'csv');
const OUT_FILE = path.join(CSV_DIR, 'formated.json');

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const pad = (n: number | string): string => String(n).padStart(2, '0');

/**
 * Minimal RFC-4180-style CSV parser: handles double-quoted fields (including embedded
 * commas), "" escaped quotes, and \r\n / \n line endings. Returns rows of raw fields.
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

/** Coerce a CSV cell to number|null. Dash/blank/missing cells become null. */
function toNumberOrNull(raw: string): number | null {
  const t = raw.trim();
  if (!t || t === '-') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Maps a header label to the JSON key used in formated.json. */
function keyForHeader(raw: string): string {
  const t = raw.trim();
  if (t === 'Commodity Group') return 'commodityGroup';
  if (t === 'Commodity') return 'commodity';
  if (/^MSP\b/.test(t)) return 'msp';
  const m = t.match(/^(Price|Arrival) on (\d{2}) ([A-Za-z]{3}), (\d{4})$/);
  if (m) {
    const monthNum = MONTHS.indexOf(m[3]) + 1;
    if (monthNum > 0) {
      // Key format must match the schema consumed downstream: priceOnDDMmmYYYY,
      // e.g. "Price on 03 Sep, 2026" -> priceOn03Sep2026.
      return `${m[1] === 'Price' ? 'price' : 'arrival'}On${pad(m[2])}${m[3]}${m[4]}`;
    }
  }
  // Fallback: camelCase the header so we never silently drop a column.
  return t
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w, idx) => (idx === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join('');
}

/** Matches the report title row, e.g. "Marketwise Price & Arrival Report (03-09-2026)". */
function parseTitleRow(fields: string[]): { reportTitle: string; reportDate: string } {
  const joined = fields.filter(Boolean).join(' ');
  const m = joined.match(/([^(]+?)\((\d{2})-(\d{2})-(\d{4})\)/);
  if (!m) {
    throw new Error(`Could not parse report title/date from CSV row: "${joined}"`);
  }
  return {
    reportTitle: m[1].trim(),
    reportDate: `${m[4]}-${m[3]}-${m[2]}`,
  };
}

function main(): void {
  const files = fs.readdirSync(CSV_DIR).filter((f) => /^Market_Wise_Price_Arrival_.+\.csv$/i.test(f));
  if (files.length === 0) {
    throw new Error(`No "Market_Wise_Price_Arrival_*.csv" found in ${CSV_DIR}`);
  }
  const csvFile = path.join(CSV_DIR, files[0]);
  const rows = parseCsv(fs.readFileSync(csvFile, 'utf8'))
    .filter((r) => r.some((c) => c.trim() !== ''));

  if (rows.length < 4) {
    throw new Error(`CSV ${files[0]} has no data rows (got ${rows.length} rows)`);
  }

  const { reportTitle, reportDate } = parseTitleRow(rows[0]);
  const headers = rows[2];

  const colKeys = headers.map((h) => keyForHeader(h));

  const commodities = rows.slice(3).map((cells) => {
    const record: Record<string, unknown> = {};
    cells.forEach((cell, i) => {
      const key = colKeys[i];
      if (!key) return;
      if (key === 'commodityGroup' || key === 'commodity') {
        record[key] = cell.trim();
      } else {
        record[key] = toNumberOrNull(cell);
      }
    });
    return record;
  });

  const output = { reportTitle, reportDate, commodities };
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log('formatted', path.basename(csvFile), `-> ${OUT_FILE}`);
  console.log(`report: ${reportTitle} (${reportDate}), ${commodities.length} commodities`);
  console.log(`columns: ${colKeys.join(', ')}`);
}

main();