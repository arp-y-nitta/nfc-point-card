"use client";

import { Suspense } from "react";
import HomePage from "./HomePage";
import LoadingPage from "../components/LoadingPage";

export default function Page() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <HomePage />
    </Suspense>
  );
}
