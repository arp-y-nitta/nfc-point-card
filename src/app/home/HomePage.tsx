"use client";
//ホーム画面
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { initializeLiff, getUserProfile } from "../liff";
import { storeNames } from "../utils/stores";
import Image from "next/image";
import LoadingPage from "../components/LoadingPage";
import { User, ScanRecord } from "../utils/types";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    const initLiffAndGetProfile = async () => {
      try {
        setIsLoading(true);

        // LIFF初期化
        const initialized = await initializeLiff();

        if (initialized) {
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
        }
      } catch (err) {
        console.error("Error:", err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    initLiffAndGetProfile();
  }, [router]);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message.includes("network")) {
        return "ネットワーク接続に問題が発生しました。";
      }
      if (error.message.includes("timeout")) {
        return "サーバーの応答がありません。";
      }
    }
    return "予期せぬエラーが発生しました。時間をおいて再度お試しください。";
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ヘッダー */}
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-2xl font-bold">かざポ</h1>
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
                {userData.scanHistory.map((scan: ScanRecord, index: number) => (
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
