"use client";

import { AuthProvider } from "react-oidc-context";
import { PropsWithChildren, useMemo } from "react";

export function AppAuthProvider({ children }: PropsWithChildren) {

  const oidcConfig = useMemo(() => ({
    authority:
      process.env.NEXT_PUBLIC_KEYCLOAK_URL +
      "/realms/" +
      process.env.NEXT_PUBLIC_KEYCLOAK_REALM,
    client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
    redirect_uri: process.env.NEXT_PUBLIC_BASE_URL,
    onSigninCallback: () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }), []);

  return <AuthProvider {...oidcConfig}>{children}</AuthProvider>;
}