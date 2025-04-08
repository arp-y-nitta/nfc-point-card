"use client";
//ローディング画面
export default function LoadingPage() {
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
