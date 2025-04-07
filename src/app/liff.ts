import liff from "@line/liff";

const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";

export const initializeLiff = async () => {
  try {
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

    await liff.init({ liffId });
    console.log("LIFF initialized successfully");
    return true;
  } catch (error) {
    console.error("LIFF initialization failed", error);
    return false;
  }
};

export const getUserProfile = async () => {
  try {
    // ブラウザ環境チェック
    if (typeof window === "undefined") {
      console.error("LIFF cannot be used in a non-browser environment");
      return null;
    }

    if (!liff.isLoggedIn()) {
      console.log("User is not logged in, redirecting to login");
      liff.login();
      return null;
    }

    const profile = await liff.getProfile();
    console.log("User profile retrieved:", profile.displayName);
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    };
  } catch (error) {
    console.error("Failed to get user profile", error);
    return null;
  }
};

export const isLoggedIn = () => {
  try {
    return typeof window !== "undefined" && liff.isLoggedIn();
  } catch (error) {
    console.error("Failed to check login status", error);
    return false;
  }
};

export const login = () => {
  try {
    if (typeof window !== "undefined") {
      liff.login();
    }
  } catch (error) {
    console.error("Failed to login", error);
  }
};

export const logout = () => {
  try {
    if (typeof window !== "undefined") {
      liff.logout();
    }
  } catch (error) {
    console.error("Failed to logout", error);
  }
};

export const isInClient = () => {
  try {
    return typeof window !== "undefined" && liff.isInClient();
  } catch (error) {
    console.error("Failed to check if in LINE client", error);
    return false;
  }
};
