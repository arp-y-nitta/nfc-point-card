"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { initializeLiff, getUserProfile, isInClient } from "../liff";

function ScanContent() {
  const searchParams = useSearchParams();
  const storeId = searchParams.get("storeId");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    userId: string;
    storeId: string;
    success: boolean;
  } | null>(null);
  const [isInLINE, setIsInLINE] = useState(false);
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
        console.log("LIFF initialization result:", initialized);

        // デバッグ情報の収集
        let inClient = false;
        let loggedIn = false;

        if (initialized) {
          try {
            inClient = isInClient();
            // @ts-ignore - LIFFグローバル変数にアクセス
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
              userId: "browser-test-user-id",
              storeId: storeId,
              success: true,
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
            userId: "external-browser-user",
            storeId: storeId,
            success: true,
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-slate-200">
          <h1 className="text-2xl font-bold mb-4 text-slate-800">
            読み込み中...
          </h1>
          <div className="w-12 h-12 mx-auto mb-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <p className="text-slate-600">
            スキャン情報を処理しています。しばらくお待ちください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full border border-slate-200">
        <h1 className="text-2xl font-bold mb-6 text-slate-800">
          スキャン{error ? "テスト" : "完了"}
        </h1>

        {error && (
          <div className="mb-6 bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div
            className={`p-5 rounded-lg mb-6 flex flex-col items-center ${
              error
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <svg
              className="w-8 h-8 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  error
                    ? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M5 13l4 4L19 7"
                }
              />
            </svg>
            <p className="font-medium">
              {error
                ? "テストモードでの表示です"
                : "ポイントカードのスキャンが完了しました！"}
            </p>
          </div>

          <div className="text-left border border-slate-200 p-5 rounded-lg bg-slate-50">
            <div className="mb-3">
              <span className="font-semibold text-slate-700 block mb-1">
                ユーザーID:
              </span>
              <span className="text-slate-800 font-mono bg-white px-3 py-2 rounded border border-slate-200 block overflow-x-auto">
                {scanResult?.userId}
              </span>
            </div>
            <div className="mb-3">
              <span className="font-semibold text-slate-700 block mb-1">
                店舗ID:
              </span>
              <span className="text-slate-800 font-mono bg-white px-3 py-2 rounded border border-slate-200 block">
                {scanResult?.storeId}
              </span>
            </div>
            <div className="mt-3 flex items-center">
              <span className="text-sm text-slate-600 font-medium">
                LINEアプリ内:
              </span>
              <span
                className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isInLINE
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {isInLINE ? "はい" : "いいえ"}
              </span>
            </div>
          </div>
        </div>

        <p
          className={`text-sm ${
            error ? "text-amber-600" : "text-slate-500"
          } bg-slate-50 p-3 rounded-lg border border-slate-200`}
        >
          {error
            ? "これはテスト表示です。実際のスキャンはLINEアプリ内で行ってください。"
            : "このページはポイント付与の証明としてお使いいただけます。必要に応じてスクリーンショットをお撮りください。"}
        </p>

        {/* デバッグ情報 */}
        <div className="mt-6 border border-slate-200 rounded-lg p-3 bg-slate-50">
          <details>
            <summary className="text-xs font-medium text-slate-500 cursor-pointer">
              デバッグ情報
            </summary>
            {debugInfo && (
              <div className="mt-2 text-left text-xs font-mono text-slate-600">
                <div className="grid grid-cols-2 gap-1">
                  <span>LIFF ID:</span>
                  <span>{debugInfo.liffId || "未設定"}</span>

                  <span>初期化成功:</span>
                  <span>{debugInfo.initSuccess ? "はい" : "いいえ"}</span>

                  <span>LINE内:</span>
                  <span>{debugInfo.isInClient ? "はい" : "いいえ"}</span>

                  <span>ログイン済:</span>
                  <span>{debugInfo.isLoggedIn ? "はい" : "いいえ"}</span>
                </div>
                <div className="mt-2">
                  <span className="block">User Agent:</span>
                  <div className="text-[10px] break-all mt-1 bg-white p-1 rounded border border-slate-200">
                    {debugInfo.userAgent}
                  </div>
                </div>
              </div>
            )}
          </details>
        </div>
      </div>
    </div>
  );
}

// ローディング表示用のコンポーネント
function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md border border-slate-200">
        <h1 className="text-2xl font-bold mb-4 text-slate-800">
          読み込み中...
        </h1>
        <div className="w-12 h-12 mx-auto mb-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="text-slate-600">
          ページを準備しています。しばらくお待ちください。
        </p>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <ScanContent />
    </Suspense>
  );
}
