import { getContext } from "hono/context-storage";
import { deleteCookie, setCookie } from "hono/cookie";
import { env } from "../env";

export function setSession(accessToken?: string, refreshToken?: string) {
  const context = getContext();
  if (accessToken) {
    setCookie(context, "access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      domain: env().VITE_APP_URL.includes("localhost")
        ? "localhost"
        : `.${env().VITE_APP_URL.replace("https://", "")}`,
      maxAge: 34560000,
    });
  }
  if (refreshToken) {
    setCookie(context, "refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      domain: env().VITE_APP_URL.includes("localhost")
        ? "localhost"
        : `.${env().VITE_APP_URL.replace("https://", "")}`,
      maxAge: 34560000,
    });
  }
}

export function deleteSession() {
  const context = getContext();
  const accessToken = deleteCookie(context, "access_token", {
    secure: true,
    httpOnly: true,
    path: "/",
    domain: env().VITE_APP_URL.includes("localhost")
      ? "localhost"
      : `.${env().VITE_APP_URL.replace("https://", "")}`,
  });
  const refreshToken = deleteCookie(context, "refresh_token", {
    secure: true,
    httpOnly: true,
    path: "/",
    domain: env().VITE_APP_URL.includes("localhost")
      ? "localhost"
      : `.${env().VITE_APP_URL.replace("https://", "")}`,
  });
  console.log("deleted new", { accessToken, refreshToken });
  return !!accessToken && !!refreshToken;
}
