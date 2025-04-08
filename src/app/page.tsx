"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { initializeLiff, isInClient } from "./liff";

export default function Home() {
  const router = useRouter();
  const [isLiffInitialized, setIsLiffInitialized] = useState(false);
  const [isInLINE, setIsInLINE] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

    // クリック時にLINE内かブラウザかによって動作を分ける
    if (isInLINE && isLiffInitialized) {
      // LINE内では外部ブラウザでScanページを開く
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

    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-10 gap-10 bg-slate-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-slate-300 bg-gradient-to-b from-slate-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-slate-100 lg:p-4 text-slate-800">
          NFCポイントカードアプリ
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white lg:static lg:h-auto lg:w-auto lg:bg-none">
          <a
            className="flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="https://vercel.com?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            By{" "}
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              className="dark:invert"
              width={100}
              height={24}
              priority
            />
          </a>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold text-slate-800">
          NFCポイントカードアプリ
        </h1>
        <p className="max-w-prose text-lg text-slate-600">
          LINEミニアプリを使用したNFCタグスキャンによるポイントカードシステムです。
          NFCタグからアクセスされたユーザーのLINE IDと店舗IDを記録します。
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <button
            onClick={() => handleScanClick("shibuya01")}
            disabled={isLoading}
            className="rounded-lg bg-blue-600 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 md:text-base shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "読み込み中..." : "渋谷店をスキャン"}
          </button>
          <button
            onClick={() => handleScanClick("shinjuku02")}
            disabled={isLoading}
            className="rounded-lg bg-emerald-600 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 md:text-base shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "読み込み中..." : "新宿店をスキャン"}
          </button>
          <button
            onClick={() => handleScanClick("ikebukuro03")}
            disabled={isLoading}
            className="rounded-lg bg-violet-600 px-6 py-4 text-sm font-medium text-white transition-colors hover:bg-violet-700 md:text-base shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "読み込み中..." : "池袋店をスキャン"}
          </button>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg max-w-2xl w-full shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold mb-4 text-slate-800">使用方法</h2>
          <ol className="text-left list-decimal pl-6 space-y-3 text-slate-700">
            <li>実際の環境では、NFCタグにLINE LIFFのURLが書き込まれています</li>
            <li>
              ユーザーがNFCタグにスマートフォンをかざすと、このアプリが起動します
            </li>
            <li>
              LINE IDと店舗IDが自動的に取得されてポイントとして記録されます
            </li>
            <li>上記のボタンはテスト用デモリンクです</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-2xl w-full">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            LINE内でアクセスするには
          </h3>
          <p className="text-blue-700 text-sm">
            LINEミニアプリとして利用するには、LIFFのURLをNFCタグに書き込むか、LINE内で開く必要があります。
            <br />
            例:{" "}
            <code className="bg-white px-2 py-0.5 rounded text-blue-800 font-mono text-xs">
              https://liff.line.me/YOUR_LIFF_ID/scan?storeId=shibuya01
            </code>
          </p>
        </div>

        {isInLINE && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 max-w-2xl w-full">
            <p className="text-green-700 flex items-center">
              <svg
                className="w-5 h-5 mr-2"
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
              LINEアプリ内で実行中です
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
