// 店舗ごとのポイント付与数の設定
export const storePointsMap: Record<string, number> = {
  shibuya01: 10,
  shinjuku01: 10,
  ikebukuro01: 10,
  eifukucho01: 10,
  // デフォルト値
  default: 5,
};

// 店舗名のマッピング
export const storeNames: Record<string, string> = {
  shibuya01: "たこ焼き新田渋谷店",
  shinjuku01: "たこ焼き新田新宿店",
  ikebukuro01: "たこ焼き新田池袋店",
  eifukucho01: "たこ焼き新田永福町店",
  default: "不明な店舗",
};
