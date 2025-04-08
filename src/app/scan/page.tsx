"use client";

import { Suspense } from "react";
import ScanContent from "./ScanContent";
import LoadingPage from "../components/LoadingPage";

export default function Page() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <ScanContent />
    </Suspense>
  );
}
