import { NextRequest, NextResponse } from "next/server";
import { storeNames, storePointsMap } from "../../utils/stores";
import { supabase } from "@/utils/supabase";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { userId, storeId, displayName, pictureUrl } = body;

    if (!userId || !storeId) {
      return NextResponse.json(
        { error: "userId and storeId are required" },
        { status: 400 }
      );
    }

    // 店舗IDの検証
    if (!storePointsMap[storeId] && storeId !== "test") {
      return NextResponse.json(
        { error: `Invalid storeId: ${storeId}` },
        { status: 400 }
      );
    }

    const points = storePointsMap[storeId] || storePointsMap.default;

    // ユーザー情報を取得または作成
    const { data: existingUser } = await supabase
      .from("users")
      .select()
      .eq("user_id", userId)
      .single();

    if (!existingUser) {
      await supabase.from("users").insert({
        user_id: userId,
        display_name: displayName || "名称未設定ユーザー",
        picture_url: pictureUrl,
        total_points: 0,
      });
    } else if (displayName || pictureUrl) {
      await supabase
        .from("users")
        .update({
          display_name: displayName || existingUser.display_name,
          picture_url: pictureUrl || existingUser.picture_url,
        })
        .eq("user_id", userId);
    }

    // 24時間以内の同じ店舗のスキャンをチェック
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: recentScan } = await supabase
      .from("scan_records")
      .select()
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .gte("timestamp", twentyFourHoursAgo)
      .order("timestamp", { ascending: false })
      .limit(1);

    const isDuplicate = recentScan && recentScan.length > 0;

    if (!isDuplicate) {
      // スキャン記録を追加
      await supabase.from("scan_records").insert({
        user_id: userId,
        store_id: storeId,
        points: points,
      });

      // ポイントを更新
      await supabase.rpc("increment_points", {
        p_user_id: userId,
        p_points: points,
      });
    }

    // 更新されたユーザー情報を取得
    const { data: user } = await supabase
      .from("users")
      .select()
      .eq("user_id", userId)
      .single();

    // 最新のスキャン履歴を取得
    const { data: scanHistory } = await supabase
      .from("scan_records")
      .select()
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(10);

    return NextResponse.json(
      {
        success: true,
        isDuplicate,
        points: isDuplicate ? 0 : points,
        user: {
          userId: user.user_id,
          displayName: user.display_name,
          pictureUrl: user.picture_url,
          totalPoints: user.total_points,
          scanHistory: scanHistory,
        },
        storeName: storeNames[storeId] || storeNames.default,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing scan:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select()
      .eq("user_id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: scanHistory } = await supabase
      .from("scan_records")
      .select()
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    return NextResponse.json({
      userId: user.user_id,
      displayName: user.display_name,
      pictureUrl: user.picture_url,
      totalPoints: user.total_points,
      scanHistory: scanHistory,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
