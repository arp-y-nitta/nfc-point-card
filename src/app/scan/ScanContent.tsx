"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { initializeLiff, getUserProfile, isInClient } from "../liff";
import Image from "next/image";
import { ScanResult } from "../utils/types";
import LoadingPage from "../components/LoadingPage";

// エラーメッセージをより具体的に返す関数を追加
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error.message.includes("network")) {
      return "ネットワーク接続に問題が発生しました。";
    }
    if (error.message.includes("timeout")) {
      return "サーバーの応答がありません。";
    }
    if (error.message.includes("store")) {
      return "店舗情報の取得に失敗しました。";
    }
    if (error.message.includes("user") || error.message.includes("profile")) {
      return "ユーザー情報の取得に失敗しました。LINEへのログインをお願いします。";
    }
    return error.message;
  }
  return "予期せぬエラーが発生しました。時間をおいて再度お試しください。";
};

export default function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isInLINE, setIsInLINE] = useState(false);
  const [isLiffInitialized, setIsLiffInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    liffId: string;
    isInClient: boolean;
    isLoggedIn: boolean;
    initSuccess: boolean;
    userAgent: string;
  } | null>(null);

  useEffect(() => {
    const initLiffAndGetProfile = async () => {
      try {
        setIsLoading(true);
        const userAgent = navigator.userAgent;
        console.log("User Agent:", userAgent);

        // LIFF ID確認
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
        console.log("LIFF ID:", liffId);

        // LIFF初期化
        const initialized = await initializeLiff();
        setIsLiffInitialized(initialized);
        console.log("LIFF initialization result:", initialized);

        // デバッグ情報の収集
        let inClient = false;
        let loggedIn = false;

        if (initialized) {
          try {
            inClient = isInClient();
            // @ts-expect-error liffグローバル変数へのアクセス
            loggedIn = window.liff?.isLoggedIn() || false;
          } catch (e) {
            console.error("Error checking LIFF state:", e);
          }
        }

        setDebugInfo({
          liffId,
          isInClient: inClient,
          isLoggedIn: loggedIn,
          initSuccess: initialized,
          userAgent,
        });

        if (!initialized) {
          // ブラウザでの直接アクセス時
          if (storeId) {
            // デバッグモード：ブラウザからのアクセスでもテスト用にスキャン情報を表示
            setScanResult({
              success: true,
              isDuplicate: false,
              points: 10,
              user: {
                userId: "browser-test-user-id",
                displayName: "テストユーザー",
                totalPoints: 50,
              },
              storeName:
                storeId === "shibuya01"
                  ? "渋谷店"
                  : storeId === "shinjuku02"
                  ? "新宿店"
                  : "池袋店",
            });
            setError("注意: LINEアプリ外での表示です。テスト表示モードです。");
            setIsLoading(false);
            return;
          } else {
            setError(
              "店舗IDが指定されていません。URLに?storeId=XXXを追加してください。"
            );
            setIsLoading(false);
            return;
          }
        }

        // LINE内でのアクセス確認
        setIsInLINE(inClient);

        if (!storeId) {
          setError("店舗IDが指定されていません。");
          setIsLoading(false);
          return;
        }

        // LINE内でないか、ログインしていない場合はテストモード
        if (!inClient) {
          setScanResult({
            success: true,
            isDuplicate: false,
            points:
              storeId === "shibuya01" ? 10 : storeId === "shinjuku02" ? 15 : 20,
            user: {
              userId: "external-browser-user",
              displayName: "外部ブラウザユーザー",
              totalPoints: 50,
            },
            storeName:
              storeId === "shibuya01"
                ? "渋谷店"
                : storeId === "shinjuku02"
                ? "新宿店"
                : "池袋店",
          });
          setError(
            "LINEアプリ外からのアクセスです。テストモードで表示します。"
          );
          setIsLoading(false);
          return;
        }

        // ユーザープロフィール取得
        const profile = await getUserProfile();
        if (!profile) {
          setError(
            "ユーザープロフィールの取得に失敗しました。LINEへのログインをお願いします。"
          );
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
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          }),
        });

        if (!response.ok) {
          throw new Error("スキャン情報の送信に失敗しました。");
        }

        const result = await response.json();
        setScanResult(result);
      } catch (err) {
        console.error("Error:", err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    initLiffAndGetProfile();
  }, [storeId, router]);

  const handleGoToHome = () => {
    if (isInLINE && isLiffInitialized) {
      try {
        // @ts-expect-error liffグローバル変数へのアクセス
        if (window.liff) {
          // @ts-expect-error liffグローバル変数へのアクセス
          window.liff.openWindow({
            url: `${window.location.origin}/home`,
            external: false,
          });
        }
      } catch (error) {
        console.error("LIFF遷移エラー:", error);
        router.push("/home");
      }
    } else {
      router.push("/home");
    }
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold">かざポ</h1>
      </div>

      {error && (
        <div className="m-4 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {scanResult && (
        <div className="p-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
            <div
              className={`p-6 rounded-lg mb-6 flex flex-col items-center ${
                scanResult.isDuplicate
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {scanResult.isDuplicate ? (
                <>
                  <svg
                    className="w-16 h-16 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold mb-2">
                    既にスキャン済みです
                  </h2>
                  <p>同じ店舗は24時間に1回までポイント付与されます</p>
                </>
              ) : (
                <>
                  <svg
                    className="w-16 h-16 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold mb-2">スキャン成功！</h2>
                  <p>ポイントを獲得しました</p>
                </>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex items-center gap-4 mb-6">
              {scanResult.user.pictureUrl ? (
                <Image
                  src={scanResult.user.pictureUrl}
                  alt={scanResult.user.displayName}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              ) : (
                <div className="w-[60px] h-[60px] bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-2xl">
                    {scanResult.user.displayName.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {scanResult.user.displayName}
                </h3>
                <p className="text-slate-600 text-sm">
                  ユーザーID: {scanResult.user.userId.slice(0, 8)}...
                </p>
              </div>
            </div>

            {/* スキャン情報 */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">店舗</p>
                  <p className="font-bold text-slate-800">
                    {scanResult.storeName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">獲得ポイント</p>
                  <p className="font-bold text-slate-800">
                    {scanResult.isDuplicate ? (
                      <span className="text-amber-600">0 pt</span>
                    ) : (
                      <span className="text-green-600">
                        +{scanResult.points} pt
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">スキャン日時</p>
                  <p className="font-bold text-slate-800">
                    {new Date().toLocaleString("ja-JP")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">合計ポイント</p>
                  <p className="font-bold text-blue-700">
                    {scanResult.user.totalPoints} pt
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleGoToHome}
              className="w-full py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              ホームに戻る
            </button>
          </div>

          {/* デバッグ情報は開発環境でのみ表示 */}
          {process.env.NODE_ENV === "development" && debugInfo && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 mt-8">
              <h3 className="font-medium text-slate-700 mb-2">デバッグ情報</h3>
              <pre className="text-xs text-slate-600 overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
