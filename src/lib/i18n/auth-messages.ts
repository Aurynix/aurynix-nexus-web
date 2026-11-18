/** Text for the sign-in and sign-up pages, in each supported language. */

export type AuthLanguage = "en" | "ar";

/**
 * Codes the backend puts on a failed Google sign-in redirect
 * (`/auth/callback?error=access_denied&reason=<code>`). `no_account` is absent
 * because it redirects to sign-up instead of showing a message.
 */
export type GoogleFailureReason =
  | "access_denied"
  | "missing_params"
  | "state_already_used"
  | "state_unknown"
  | "invalid_state"
  | "no_email"
  | "email_unverified"
  | "account_disabled"
  | "google_access_denied"
  | "google_invalid_grant"
  | "google_scope_changed"
  | "google_redirect_uri_mismatch"
  | "google_invalid_client"
  | "google_unavailable"
  | "google_no_id_token"
  | "exchange_failed";

/** Validation messages are stored in form state as these keys, then translated. */
export type AuthErrorKey =
  | "invalidEmail"
  | "passwordRequired"
  | "passwordMin"
  | "confirmRequired"
  | "passwordMismatch";

const en = {
  switchLanguage: "العربية",
  switchLanguageLabel: "التبديل إلى العربية",
  toggleTheme: "Toggle theme",

  email: "Email",
  password: "Password",
  confirmPassword: "Confirm password",
  or: "or",
  footer: "Protected by Aurynix identity · SOC 2 Type II",

  signInTitle: "Sign in",
  signInDescription: "Enter your credentials to access your account",
  signInSubmit: "Sign in",
  signInSubmitting: "Signing in…",
  signInFailed: "Sign in failed. Please try again.",
  noAccount: "Don't have an account?",
  signUpLink: "Sign up",

  registerTitle: "Create an account",
  registerDescription: "Enter your details to get started",
  registerSubmit: "Create account",
  registerSubmitting: "Creating account…",
  registerFailed: "Registration failed. Please try again.",
  haveAccount: "Already have an account?",
  signInLink: "Sign in",

  googleContinue: "Continue with Google",
  googleSignUp: "Sign up with Google",
  googleRedirecting: "Redirecting…",
  googleNotEnabled: "Google sign-in isn't enabled on this server yet.",
  googleCouldNotStart: "Could not start Google sign-in.",
  googleNoAccount:
    "No account uses that Google address yet. Use Sign up with Google to create one with it, or sign up with an email and password.",

  showPassword: "Show password",
  hidePassword: "Hide password",

  // Errors the server reports, chosen by HTTP status rather than its wording.
  invalidCredentials: "Incorrect email or password.",
  emailTaken: "An account with this email already exists. Sign in instead.",
  tooManyAttempts: "Too many attempts. Please wait a few minutes and try again.",
  invalidDetails: "Some of the details you entered aren't valid. Please check them and try again.",
  serverError: "The server ran into a problem. Please try again later.",
  networkError: "Couldn't reach the server. Check your connection and try again.",

  // The page Google sends the browser back to.
  callbackSigningIn: "Signing you in…",
  callbackToSignUp: "Taking you to sign up…",
  callbackFailed: "Sign-in failed",
  callbackBack: "Back to sign in",
  callbackMissingCode: "That sign-in link is missing its authorization code.",
  callbackCancelled: "Google sign-in was cancelled or denied.",
  callbackCodeExpired: "This sign-in link has expired or was already used. Please start again.",
  callbackCouldNotComplete: "Could not complete Google sign-in.",

  googleReasons: {
    access_denied: "You declined the permissions Google asked for.",
    missing_params: "Google didn't send back everything needed to sign you in. Please try again.",
    state_already_used:
      "That Google link has already been used. Start again from this page — don't reuse a back button or an old tab.",
    state_unknown: "That Google link has expired. Please start again from the sign-in page.",
    invalid_state:
      "That Google link has already been used or has expired. Start again from this page — don't reuse a back button or an old tab.",
    no_email: "Google didn't share an email address for this account, so we can't sign you in.",
    email_unverified: "Google hasn't verified this email address yet. Verify it with Google, then try again.",
    account_disabled: "This account has been disabled.",
    google_access_denied: "You declined the permissions Google asked for.",
    google_invalid_grant: "That Google sign-in expired or was already used. Please try again.",
    google_scope_changed: "Google returned different permissions than expected. Please try again.",
    google_redirect_uri_mismatch:
      "Google sign-in isn't set up correctly on this server. Please contact the site owner.",
    google_invalid_client:
      "Google sign-in isn't set up correctly on this server. Please contact the site owner.",
    google_unavailable: "Couldn't reach Google. Please try again in a moment.",
    google_no_id_token: "Google didn't confirm who you are. Please try again.",
    exchange_failed:
      "Google wouldn't complete the sign-in. Try again, and if it keeps failing check that this account is allowed to use the app.",
  } satisfies Record<GoogleFailureReason, string>,

  errors: {
    invalidEmail: "Please enter a valid email address",
    passwordRequired: "Password is required",
    passwordMin: "Password must be at least 8 characters",
    confirmRequired: "Please confirm your password",
    passwordMismatch: "Passwords do not match",
  } satisfies Record<AuthErrorKey, string>,
};

export type AuthMessages = typeof en;

const ar: AuthMessages = {
  switchLanguage: "English",
  switchLanguageLabel: "Switch to English",
  toggleTheme: "تبديل المظهر",

  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  confirmPassword: "تأكيد كلمة المرور",
  or: "أو",
  footer: "محمي بنظام هوية Aurynix · SOC 2 Type II",

  signInTitle: "تسجيل الدخول",
  signInDescription: "أدخل بياناتك للوصول إلى حسابك",
  signInSubmit: "تسجيل الدخول",
  signInSubmitting: "جارٍ تسجيل الدخول…",
  signInFailed: "تعذّر تسجيل الدخول. يرجى المحاولة مرة أخرى.",
  noAccount: "ليس لديك حساب؟",
  signUpLink: "إنشاء حساب",

  registerTitle: "إنشاء حساب",
  registerDescription: "أدخل بياناتك للبدء",
  registerSubmit: "إنشاء الحساب",
  registerSubmitting: "جارٍ إنشاء الحساب…",
  registerFailed: "تعذّر إنشاء الحساب. يرجى المحاولة مرة أخرى.",
  haveAccount: "لديك حساب بالفعل؟",
  signInLink: "تسجيل الدخول",

  googleContinue: "المتابعة باستخدام Google",
  googleSignUp: "التسجيل باستخدام Google",
  googleRedirecting: "جارٍ التحويل…",
  googleNotEnabled: "تسجيل الدخول عبر Google غير مفعّل على هذا الخادم بعد.",
  googleCouldNotStart: "تعذّر بدء تسجيل الدخول عبر Google.",
  googleNoAccount:
    "لا يوجد حساب مرتبط بعنوان Google هذا بعد. استخدم «التسجيل باستخدام Google» لإنشاء حساب به، أو سجّل باستخدام بريد إلكتروني وكلمة مرور.",

  showPassword: "إظهار كلمة المرور",
  hidePassword: "إخفاء كلمة المرور",

  invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  emailTaken: "يوجد حساب بهذا البريد الإلكتروني بالفعل. سجّل الدخول بدلًا من ذلك.",
  tooManyAttempts: "محاولات كثيرة جدًا. يرجى الانتظار بضع دقائق ثم المحاولة مرة أخرى.",
  invalidDetails: "بعض البيانات التي أدخلتها غير صالحة. يرجى مراجعتها والمحاولة مرة أخرى.",
  serverError: "حدثت مشكلة في الخادم. يرجى المحاولة لاحقًا.",
  networkError: "تعذّر الوصول إلى الخادم. تحقّق من اتصالك وحاول مرة أخرى.",

  callbackSigningIn: "جارٍ تسجيل دخولك…",
  callbackToSignUp: "جارٍ نقلك إلى إنشاء حساب…",
  callbackFailed: "تعذّر تسجيل الدخول",
  callbackBack: "العودة إلى تسجيل الدخول",
  callbackMissingCode: "رابط تسجيل الدخول هذا لا يحتوي على رمز التفويض.",
  callbackCancelled: "تم إلغاء تسجيل الدخول عبر Google أو رفضه.",
  callbackCodeExpired: "انتهت صلاحية رابط تسجيل الدخول هذا أو تم استخدامه من قبل. يرجى البدء من جديد.",
  callbackCouldNotComplete: "تعذّر إكمال تسجيل الدخول عبر Google.",

  googleReasons: {
    access_denied: "لقد رفضت الأذونات التي طلبتها Google.",
    missing_params: "لم ترسل Google كل ما يلزم لتسجيل دخولك. يرجى المحاولة مرة أخرى.",
    state_already_used:
      "تم استخدام رابط Google هذا من قبل. ابدأ من جديد من هذه الصفحة، ولا تستخدم زر الرجوع أو علامة تبويب قديمة.",
    state_unknown: "انتهت صلاحية رابط Google هذا. يرجى البدء من جديد من صفحة تسجيل الدخول.",
    invalid_state:
      "تم استخدام رابط Google هذا من قبل أو انتهت صلاحيته. ابدأ من جديد من هذه الصفحة، ولا تستخدم زر الرجوع أو علامة تبويب قديمة.",
    no_email: "لم تشارك Google عنوان بريد إلكتروني لهذا الحساب، لذا لا يمكننا تسجيل دخولك.",
    email_unverified: "لم تتحقق Google من عنوان البريد الإلكتروني هذا بعد. تحقّق منه لدى Google ثم حاول مرة أخرى.",
    account_disabled: "تم تعطيل هذا الحساب.",
    google_access_denied: "لقد رفضت الأذونات التي طلبتها Google.",
    google_invalid_grant: "انتهت صلاحية تسجيل الدخول عبر Google أو تم استخدامه من قبل. يرجى المحاولة مرة أخرى.",
    google_scope_changed: "أعادت Google أذونات مختلفة عن المتوقع. يرجى المحاولة مرة أخرى.",
    google_redirect_uri_mismatch:
      "تسجيل الدخول عبر Google غير مُعدّ بشكل صحيح على هذا الخادم. يرجى التواصل مع مالك الموقع.",
    google_invalid_client:
      "تسجيل الدخول عبر Google غير مُعدّ بشكل صحيح على هذا الخادم. يرجى التواصل مع مالك الموقع.",
    google_unavailable: "تعذّر الوصول إلى Google. يرجى المحاولة بعد قليل.",
    google_no_id_token: "لم تؤكد Google هويتك. يرجى المحاولة مرة أخرى.",
    exchange_failed:
      "لم تُكمل Google تسجيل الدخول. حاول مرة أخرى، وإذا استمرت المشكلة فتأكد من أن هذا الحساب مسموح له باستخدام التطبيق.",
  },

  errors: {
    invalidEmail: "يرجى إدخال بريد إلكتروني صالح",
    passwordRequired: "كلمة المرور مطلوبة",
    passwordMin: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
    confirmRequired: "يرجى تأكيد كلمة المرور",
    passwordMismatch: "كلمتا المرور غير متطابقتين",
  },
};

export const AUTH_MESSAGES: Record<AuthLanguage, AuthMessages> = { en, ar };

/** Translate a validation key from form state; unknown text passes through. */
export function translateError(t: AuthMessages, message: string | undefined) {
  if (!message) return null;
  return t.errors[message as AuthErrorKey] ?? message;
}

/** Text for a failed Google redirect, or null for a code we don't know. */
export function translateGoogleReason(t: AuthMessages, reason: string | null) {
  if (!reason) return null;
  return t.googleReasons[reason.trim().toLowerCase() as GoogleFailureReason] ?? null;
}
