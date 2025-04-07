import liff from "@line/liff";

const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "";

export const initializeLiff = async () => {
  try {
    await liff.init({ liffId });
    console.log("LIFF initialized successfully");
    return true;
  } catch (error) {
    console.error("LIFF initialization failed", error);
    return false;
  }
};

export const getUserProfile = async () => {
  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }

  try {
    const profile = await liff.getProfile();
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
  return liff.isLoggedIn();
};

export const login = () => {
  liff.login();
};

export const logout = () => {
  liff.logout();
};

export const isInClient = () => {
  return liff.isInClient();
};
