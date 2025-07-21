import { Loader2 } from "lucide-react";

export default function Loading() {
  // This can be kept for initial server-side loading, but the client-side loader in layout.tsx will be more prominent for page-to-page navigation.
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
