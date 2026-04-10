import React, { createContext, useState, useContext, ReactNode } from 'react';
import h1 from '@/assets/h1.png';

interface UserInfo {
  name: string;
  email: string;
  avatar: string;
}

interface UserContextType {
  userInfo: UserInfo;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>;
}

const defaultUserInfo: UserInfo = {
  name: "Guest",
  email: "guest@example.com",
  avatar: h1,
};

export const UserContext = createContext<UserContextType>({
  userInfo: defaultUserInfo,
  setUserInfo: () => {},
});

export const useUserContext = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(defaultUserInfo);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export async function getUserInfo() {
  try {
    const response = await fetch('/.auth/me');
    if (!response.ok) {
      return defaultUserInfo;
    }

    const payload = await response.json();
    const clientPrincipal = Array.isArray(payload)
      ? payload[0]?.clientPrincipal
      : payload?.clientPrincipal;

    if (!clientPrincipal?.userDetails) {
      return defaultUserInfo;
    }

    const email = clientPrincipal.userDetails;
    const name =
      clientPrincipal.userRoles?.find((role: string) => role && role !== 'anonymous') ||
      clientPrincipal.userDetails?.split('@')[0] ||
      defaultUserInfo.name;

    return {
      name,
      email: email,
      avatar: h1,
    };
  } catch (error) {
    // console.error("Failed to fetch user info:", error);
    return defaultUserInfo;
  }
}
