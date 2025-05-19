'use client';

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error || "An error occurred during authentication"}
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Try again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
} 