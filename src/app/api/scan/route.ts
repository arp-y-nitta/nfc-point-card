import { NextResponse } from "next/server";

// データ型の定義
interface ScanRecord {
  userId: string;
  storeId: string;
  timestamp: Date;
  points: number;
}

interface User {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  totalPoints: number;
  scanHistory: ScanRecord[];
}

// インメモリデータベース（実際の開発では永続化ストレージを使用すべき）
const usersDB: Record<string, User> = {};

// 店舗ごとのポイント付与数の設定
const storePointsMap: Record<string, number> = {
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, storeId, displayName, pictureUrl } = body;

    if (!userId || !storeId) {
      return NextResponse.json(
        { error: "userId and storeId are required" },
        { status: 400 }
      );
    }

    // 店舗に応じたポイント付与数を決定
    const points = storePointsMap[storeId] || storePointsMap.default;

    // スキャン履歴を作成
    const scanRecord: ScanRecord = {
      userId,
      storeId,
      timestamp: new Date(),
      points,
    };

    // ユーザー情報を取得または新規作成
    if (!usersDB[userId]) {
      usersDB[userId] = {
        userId,
        displayName: displayName || "名称未設定ユーザー",
        pictureUrl,
        totalPoints: 0,
        scanHistory: [],
      };
    }

    // ユーザー情報を更新
    const user = usersDB[userId];
    if (displayName) user.displayName = displayName;
    if (pictureUrl) user.pictureUrl = pictureUrl;

    // 最後のスキャンから24時間以内の同じ店舗のスキャンはポイント加算しない
    const lastScan = user.scanHistory.find(
      (scan) =>
        scan.storeId === storeId &&
        new Date().getTime() - new Date(scan.timestamp).getTime() <
          24 * 60 * 60 * 1000
    );

    const isDuplicate = lastScan !== undefined;

    // ポイントを加算（重複でない場合のみ）
    if (!isDuplicate) {
      user.totalPoints += points;
      // 履歴に追加
      user.scanHistory.push(scanRecord);
    }

    console.log("User data updated:", user);

    // レスポンスにはユーザー情報全体を返す
    return NextResponse.json(
      {
        success: true,
        isDuplicate,
        points: isDuplicate ? 0 : points,
        user: {
          userId: user.userId,
          displayName: user.displayName,
          pictureUrl: user.pictureUrl,
          totalPoints: user.totalPoints,
          scanHistory: user.scanHistory
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
            .slice(0, 10), // 最新10件のみ返す
        },
        storeName: storeNames[storeId] || storeNames.default,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing scan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ユーザーの履歴取得API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const user = usersDB[userId];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.userId,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      totalPoints: user.totalPoints,
      scanHistory: user.scanHistory.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
