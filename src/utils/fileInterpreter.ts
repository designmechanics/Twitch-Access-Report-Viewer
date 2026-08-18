import Papa from 'papaparse';
import { ParsedCsvData, ParsedJsonData } from '../types';

export function parseCsvContent(csvString: string): ParsedCsvData {
  // Strip UTF-8 BOM if present
  const sanitized = (csvString || '').replace(/^\uFEFF/, '').trim();

  const result = Papa.parse<Record<string, any>>(sanitized, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
    transformHeader: (h) => h.replace(/^\uFEFF/, '').trim()
  });

  const rawParse = Papa.parse<string[]>(sanitized, {
    header: false,
    skipEmptyLines: 'greedy'
  });

  const headers = result.meta.fields?.map((h) => h.replace(/^\uFEFF/, '').trim()) || (rawParse.data[0] ? rawParse.data[0].map(h => String(h).replace(/^\uFEFF/, '').trim()) : []);
  const rows = (result.data || []).filter((r) => r && Object.keys(r).length > 0);
  const rawRows = rawParse.data || [];

  // Calculate statistics
  const totalNumericFields: Record<string, number> = {};
  const distinctCounts: Record<string, number> = {};
  let dateField: string | undefined;
  let minDate = '';
  let maxDate = '';

  for (const h of headers) {
    const isDateHeader = /date|time|timestamp|created_at|started_at/i.test(h);
    const sampleVal = rows[0]?.[h];
    
    if (isDateHeader && !dateField && typeof sampleVal === 'string' && !isNaN(Date.parse(sampleVal))) {
      dateField = h;
    }

    const uniqueSet = new Set();
    let numericSum = 0;
    let hasNumeric = false;

    for (const r of rows) {
      const val = r[h];
      if (val !== undefined && val !== null && val !== '') {
        uniqueSet.add(String(val));
        if (typeof val === 'number' && !isNaN(val)) {
          hasNumeric = true;
          numericSum += val;
        }
      }
    }

    distinctCounts[h] = uniqueSet.size;
    if (hasNumeric) {
      totalNumericFields[h] = numericSum;
    }
  }

  if (dateField) {
    const dates: number[] = [];
    for (const r of rows) {
      const val = r[dateField];
      if (typeof val === 'string' || typeof val === 'number') {
        const parsed = Date.parse(String(val));
        if (!isNaN(parsed)) dates.push(parsed);
      }
    }
    if (dates.length > 0) {
      dates.sort((a, b) => a - b);
      minDate = new Date(dates[0]).toISOString().split('T')[0];
      maxDate = new Date(dates[dates.length - 1]).toISOString().split('T')[0];
    }
  }

  return {
    headers,
    rows,
    rawRows,
    rowCount: rows.length,
    columnCount: headers.length,
    summary: {
      totalNumericFields,
      dateField,
      dateRange: minDate && maxDate ? { min: minDate, max: maxDate } : undefined,
      distinctCounts
    }
  };
}

export function parseJsonContent(jsonString: string): ParsedJsonData {
  try {
    const data = JSON.parse(jsonString);
    const isArray = Array.isArray(data);
    const isObject = typeof data === 'object' && data !== null && !isArray;

    let itemCount = 0;
    let keys: string[] = [];

    if (isArray) {
      itemCount = data.length;
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        keys = Object.keys(data[0]);
      }
    } else if (isObject) {
      keys = Object.keys(data);
      itemCount = keys.length;
    }

    return {
      data,
      isObject,
      isArray,
      itemCount,
      keys
    };
  } catch (err: any) {
    throw new Error(`JSON parsing failed: ${err.message}`);
  }
}
