import { signIn, signOut, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export default function SignInButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition-all hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100"
      >
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "https://devit.to" })}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900"
    >
      <FcGoogle className="h-5 w-5" />
      <span>Continue with Google</span>
    </button>
  );
} 