// 共通の型定義

export interface ScanRecord {
  userId: string;
  storeId: string;
  timestamp: Date;
  points: number;
}

export interface User {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  totalPoints: number;
  scanHistory: ScanRecord[];
}

export interface ScanResult {
  success: boolean;
  isDuplicate: boolean;
  points: number;
  user: {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    totalPoints: number;
  };
  storeName: string;
}

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}
