export interface ZipFileEntry {
  path: string;
  name: string;
  size: number;
  date: Date;
  dir: boolean;
  extension: string;
  blob?: Blob;
  category: string;
  rowCount?: number;
  isPopulated?: boolean;
}

export interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  extension?: string;
  rowCount?: number;
  isPopulated?: boolean;
  children?: FileTreeNode[];
  fileEntry?: ZipFileEntry;
}

export interface ParsedCsvData {
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
  rawRows: string[][];
  rowCount: number;
  columnCount: number;
  summary?: {
    totalNumericFields: Record<string, number>;
    dateField?: string;
    dateRange?: { min: string; max: string };
    distinctCounts: Record<string, number>;
  };
}

export interface ParsedJsonData {
  data: any;
  isObject: boolean;
  isArray: boolean;
  itemCount: number;
  keys: string[];
}

export type ViewMode = 'report' | 'table' | 'raw';

export type ChartStyle = '3d' | 'bar' | 'scatter' | 'line';

export interface SectionChartSettings {
  chat: ChartStyle;
  watchTime: ChartStyle;
  subscriptions: ChartStyle;
  bits: ChartStyle;
  security: ChartStyle;
  channelPoints: ChartStyle;
  userDetails: ChartStyle;
  generic: ChartStyle;
  animateReveal: boolean;
  colorTheme: 'twitch' | 'cyberpunk' | 'emerald' | 'amber';
}

export interface TwitchReportStats {
  totalFiles: number;
  totalSize: number;
  csvCount: number;
  jsonCount: number;
  otherCount: number;
  populatedFilesCount: number;
  emptyFilesCount: number;
  totalRecordsCount: number;
  categories: { name: string; count: number; populatedCount: number }[];
}
