"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { initializeLiff, getUserProfile } from "../liff";

export default function ScanPage() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    userId: string;
    storeId: string;
    success: boolean;
  } | null>(null);

  useEffect(() => {
    const initLiffAndGetProfile = async () => {
      try {
        setIsLoading(true);

        // LIFF初期化
        const initialized = await initializeLiff();
        if (!initialized) {
          setError(
            "LIFFの初期化に失敗しました。LINE内でアクセスしてください。"
          );
          setIsLoading(false);
          return;
        }

        if (!storeId) {
          setError("店舗IDが指定されていません。");
          setIsLoading(false);
          return;
        }

        // ユーザープロフィール取得
        const profile = await getUserProfile();
        if (!profile) {
          setError("ユーザープロフィールの取得に失敗しました。");
          setIsLoading(false);
          return;
        }

        // APIにスキャン情報を送信
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: profile.userId,
            storeId: storeId,
          }),
        });

        if (!response.ok) {
          throw new Error("スキャン情報の送信に失敗しました。");
        }

        const result = await response.json();
        setScanResult({
          userId: profile.userId,
          storeId: storeId,
          success: result.success,
        });
      } catch (err) {
        console.error("Error:", err);
        setError(
          err instanceof Error ? err.message : "不明なエラーが発生しました。"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initLiffAndGetProfile();
  }, [storeId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">読み込み中...</h1>
          <p>スキャン情報を処理しています。しばらくお待ちください。</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">スキャン完了</h1>

        <div className="mb-6">
          <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
            <svg
              className="w-6 h-6 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p>ポイントカードのスキャンが完了しました！</p>
          </div>

          <div className="text-left border p-4 rounded-lg bg-gray-50">
            <div className="mb-2">
              <span className="font-semibold text-gray-700">ユーザーID:</span>
              <span className="ml-2 text-gray-600">{scanResult?.userId}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">店舗ID:</span>
              <span className="ml-2 text-gray-600">{scanResult?.storeId}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          このページはポイント付与の証明としてお使いいただけます。
          必要に応じてスクリーンショットをお撮りください。
        </p>
      </div>
    </div>
  );
}
