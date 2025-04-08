// 店舗ごとのポイント付与数の設定
export const storePointsMap: Record<string, number> = {
  shibuya01: 10,
  shinjuku02: 15,
  ikebukuro03: 20,
  // デフォルト値
  default: 5,
};

// 店舗名のマッピング
export const storeNames: Record<string, string> = {
  shibuya01: "渋谷店",
  shinjuku02: "新宿店",
  ikebukuro03: "池袋店",
  default: "不明な店舗",
};
