"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-slate-900">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">😵</div>
        <h1 className="mb-2 text-2xl font-bold text-white">
          Algo deu errado
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-[#0A2463] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0A2463]/80"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
