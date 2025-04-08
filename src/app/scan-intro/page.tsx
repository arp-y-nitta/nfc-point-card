"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { initializeLiff, isInClient } from "../liff";

export default function ScanIntroPage() {
  const router = useRouter();
  const [isLiffInitialized, setIsLiffInitialized] = useState(false);
  const [isInLINE, setIsInLINE] = useState(false);

  useEffect(() => {
    async function initLiff() {
      try {
        const initialized = await initializeLiff();
        setIsLiffInitialized(initialized);
        if (initialized) {
          setIsInLINE(isInClient());
        }
      } catch (error) {
        console.error("LIFFの初期化に失敗しました", error);
      }
    }

    initLiff();
  }, []);

  const handleScanClick = (storeId: string) => {
    if (isInLINE && isLiffInitialized) {
      try {
        // @ts-expect-error liffグローバル変数へのアクセス
        if (window.liff) {
          // LIFFブラウザ内での遷移
          // @ts-expect-error liffグローバル変数へのアクセス
          window.liff.openWindow({
            url: `${window.location.origin}/scan?storeId=${storeId}`,
            external: false,
          });
        }
      } catch (error) {
        console.error("LIFF遷移エラー:", error);
        // エラー時は通常の遷移にフォールバック
        router.push(`/scan?storeId=${storeId}`);
      }
    } else {
      // 通常のブラウザではNext.jsのルーターを使用
      router.push(`/scan?storeId=${storeId}`);
    }
  };

  const goToHome = () => {
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold">スキャン</h1>
      </div>

      <div className="p-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            NFCポイントカードをスキャンしましょう
          </h2>
          <p className="text-slate-600 mb-6">
            実際の環境では、NFCタグをスキャンするだけでポイントが自動的に加算されます。
            <br />
            このデモでは、下記のボタンをクリックすることでスキャンをシミュレートします。
          </p>

          <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">
              ポイント付与について
            </h3>
            <ul className="text-blue-700 text-sm list-disc pl-5 space-y-1">
              <li>渋谷店: 10ポイント</li>
              <li>新宿店: 15ポイント</li>
              <li>池袋店: 20ポイント</li>
              <li>同じ店舗は24時間に1回までポイント付与されます</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-slate-800">
              テスト用スキャンボタン:
            </h3>
            <button
              onClick={() => handleScanClick("shibuya01")}
              className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
            >
              渋谷店をスキャン
            </button>
            <button
              onClick={() => handleScanClick("shinjuku02")}
              className="bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700"
            >
              新宿店をスキャン
            </button>
            <button
              onClick={() => handleScanClick("ikebukuro03")}
              className="bg-violet-600 text-white py-3 px-4 rounded-lg hover:bg-violet-700"
            >
              池袋店をスキャン
            </button>
          </div>
        </div>

        <button
          onClick={goToHome}
          className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}
