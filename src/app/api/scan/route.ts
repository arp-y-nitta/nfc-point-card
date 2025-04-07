import { NextResponse } from "next/server";

// シンプルなインメモリデータベース（実際の開発では永続化ストレージを使用すべき）
const scanHistory: Array<{ userId: string; storeId: string; timestamp: Date }> =
  [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, storeId } = body;

    if (!userId || !storeId) {
      return NextResponse.json(
        { error: "userId and storeId are required" },
        { status: 400 }
      );
    }

    // スキャン履歴を保存
    const scanRecord = {
      userId,
      storeId,
      timestamp: new Date(),
    };

    scanHistory.push(scanRecord);

    console.log("New scan recorded:", scanRecord);
    console.log("Current scan history:", scanHistory);

    return NextResponse.json({ success: true, scanRecord }, { status: 201 });
  } catch (error) {
    console.error("Error processing scan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// スキャン履歴の取得用（オプション）
export async function GET() {
  return NextResponse.json({ scanHistory });
}
