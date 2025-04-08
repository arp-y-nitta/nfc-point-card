"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initializeLiff, getUserProfile, isInClient } from "../liff";
import { storeNames } from "../utils/stores";
import Image from "next/image";

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

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isLiffInitialized, setIsLiffInitialized] = useState(false);
  const [isInLINE, setIsInLINE] = useState(false);

  useEffect(() => {
    const initLiffAndGetProfile = async () => {
      try {
        setIsLoading(true);

        // LIFF初期化
        const initialized = await initializeLiff();
        setIsLiffInitialized(initialized);

        if (initialized) {
          setIsInLINE(isInClient());

          // ユーザープロフィール取得
          const profile = await getUserProfile();
          if (!profile) {
            setError(
              "ユーザープロフィールの取得に失敗しました。LINEへのログインをお願いします。"
            );
            setIsLoading(false);
            return;
          }

          // ユーザーデータを取得
          const response = await fetch(`/api/scan?userId=${profile.userId}`);

          if (response.ok) {
            const userData = await response.json();
            setUserData(userData);
          } else if (response.status === 404) {
            // ユーザーが見つからない場合は、初回ユーザーとして表示
            setUserData({
              userId: profile.userId,
              displayName: profile.displayName,
              pictureUrl: profile.pictureUrl,
              totalPoints: 0,
              scanHistory: [],
            });
          } else {
            throw new Error("ユーザーデータの取得に失敗しました。");
          }
        } else {
          // テストモード
          setUserData({
            userId: "test-user-id",
            displayName: "テストユーザー",
            pictureUrl: "",
            totalPoints: 50,
            scanHistory: [
              {
                userId: "test-user-id",
                storeId: "shibuya01",
                timestamp: new Date(),
                points: 10,
              },
              {
                userId: "test-user-id",
                storeId: "shinjuku02",
                timestamp: new Date(Date.now() - 86400000),
                points: 15,
              },
              {
                userId: "test-user-id",
                storeId: "ikebukuro03",
                timestamp: new Date(Date.now() - 172800000),
                points: 20,
              },
            ],
          });
          setError("注意: LINEアプリ外での表示です。テスト表示モードです。");
        }
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
  }, [router]);

  const handleScanButtonClick = () => {
    if (isInLINE && isLiffInitialized) {
      try {
        // @ts-expect-error liffグローバル変数へのアクセス
        if (window.liff) {
          // LIFF URLを開く（NFCタグと同じURLにアクセス）
          // @ts-expect-error liffグローバル変数へのアクセス
          window.liff.openWindow({
            url: `${window.location.origin}/scan-intro`,
            external: false,
          });
        }
      } catch (error) {
        console.error("LIFF遷移エラー:", error);
        router.push("/scan-intro");
      }
    } else {
      router.push("/scan-intro");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md border border-slate-200">
          <h1 className="text-2xl font-bold mb-4 text-slate-800">
            読み込み中...
          </h1>
          <div className="w-12 h-12 mx-auto mb-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <p className="text-slate-600">
            ユーザー情報を取得しています。しばらくお待ちください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold">ポイントカード</h1>
      </div>

      {error && (
        <div className="m-4 p-4 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
          <p>{error}</p>
        </div>
      )}

      {userData && (
        <>
          {/* プロフィールセクション */}
          <div className="bg-white m-4 p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              {userData.pictureUrl ? (
                <Image
                  src={userData.pictureUrl}
                  alt={userData.displayName}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              ) : (
                <div className="w-[60px] h-[60px] bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-2xl">
                    {userData.displayName.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {userData.displayName}
                </h2>
                <p className="text-slate-600 text-sm">{userData.userId}</p>
              </div>
            </div>

            {/* 合計ポイント */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-700 mb-1">合計ポイント</p>
              <p className="text-3xl font-bold text-blue-800">
                {userData.totalPoints} pt
              </p>
            </div>
          </div>

          {/* スキャンボタン */}
          <div className="m-4 flex justify-center">
            <button
              onClick={handleScanButtonClick}
              className="bg-green-600 text-white py-4 px-8 rounded-full text-lg font-bold shadow-lg hover:bg-green-700"
            >
              スキャンする
            </button>
          </div>

          {/* 履歴セクション */}
          <div className="bg-white m-4 p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              ポイント履歴
            </h2>

            {userData.scanHistory.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                履歴がありません
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {userData.scanHistory.map((scan, index) => (
                  <li key={index} className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-slate-800">
                          {storeNames[scan.storeId] || storeNames.default}
                        </p>
                        <p className="text-sm text-slate-500">
                          {new Date(scan.timestamp).toLocaleString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        +{scan.points} pt
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
