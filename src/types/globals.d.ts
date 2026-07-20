export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      onboardingComplete?: boolean;
      portalRole?: "admin" | "buyer" | "seller";
      organizationName?: string;
      country?: string;
      whatsapp?: string;
    };
  }
}
