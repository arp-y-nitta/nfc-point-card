import liff from "@line/liff";
import { LiffProfile } from "./utils/types";

// LIFFのIDを環境変数から取得
const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";
console.log("LIFF ID from env:", liffId);

// シングルトンパターンで初期化状態を保持
let isInitialized = false;

export const initializeLiff = async () => {
  try {
    // すでに初期化済みなら再初期化しない
    if (isInitialized) {
      console.log("LIFF already initialized");
      return true;
    }

    // ブラウザ環境チェック
    if (typeof window === "undefined") {
      console.error("LIFF cannot be initialized in a non-browser environment");
      return false;
    }

    console.log("Initializing LIFF with ID:", liffId);

    if (!liffId) {
      console.error(
        "LIFF ID is not set. Please set NEXT_PUBLIC_LIFF_ID in .env.local"
      );
      return false;
    }

    await liff.init({
      liffId: liffId,
      withLoginOnExternalBrowser: true, // 外部ブラウザでのログインを許可
    });

    isInitialized = true;
    console.log("LIFF initialization successful");

    // LINE内での実行かどうかをログ出力
    const isInClient = liff.isInClient();
    console.log("Is in LINE app:", isInClient);

    // ログイン状態をログ出力
    const isLoggedIn = liff.isLoggedIn();
    console.log("Is logged in:", isLoggedIn);

    return true;
  } catch (error) {
    console.error("LIFF initialization failed", error);
    return false;
  }
};

export const getUserProfile = async (): Promise<LiffProfile | null> => {
  try {
    // ブラウザ環境チェック
    if (typeof window === "undefined") {
      console.error("LIFF cannot be used in a non-browser environment");
      return null;
    }

    // 初期化されていなければ初期化
    if (!isInitialized) {
      const initialized = await initializeLiff();
      if (!initialized) {
        console.error("Failed to initialize LIFF");
        return null;
      }
    }

    // ログインチェック
    if (!liff.isLoggedIn()) {
      console.log("User is not logged in, redirecting to login");
      // 外部ブラウザでは、LINEログイン画面にリダイレクト
      liff.login();
      return null;
    }

    // ユーザープロフィール取得
    const profile = await liff.getProfile();
    console.log("User profile retrieved:", profile.displayName);

    // 明示的な型変換でLiffProfileに適合
    const liffProfile: LiffProfile = {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage,
    };

    return liffProfile;
  } catch (error) {
    console.error("Failed to get user profile", error);
    return null;
  }
};

export const isLoggedIn = () => {
  try {
    if (typeof window === "undefined") return false;
    if (!isInitialized) return false;
    return liff.isLoggedIn();
  } catch (error) {
    console.error("Failed to check login status", error);
    return false;
  }
};

export const login = () => {
  try {
    if (typeof window === "undefined") return;
    if (!isInitialized) {
      initializeLiff().then(() => {
        liff.login();
      });
      return;
    }
    liff.login();
  } catch (error) {
    console.error("Failed to login", error);
  }
};

export const logout = () => {
  try {
    if (typeof window === "undefined") return;
    if (!isInitialized) return;
    liff.logout();
  } catch (error) {
    console.error("Failed to logout", error);
  }
};

export const isInClient = () => {
  try {
    if (typeof window === "undefined") return false;
    if (!isInitialized) return false;
    return liff.isInClient();
  } catch (error) {
    console.error("Failed to check if in LINE client", error);
    return false;
  }
};
