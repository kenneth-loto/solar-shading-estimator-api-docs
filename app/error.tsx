"use client";

import * as Sentry from "@sentry/nextjs";
import { RotateCcw, ServerCrash } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function ErrorPage({ error, unstable_retry }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ServerCrash />
        </EmptyMedia>
        <EmptyTitle as="h1" className="font-semibold text-lg">
          Something went wrong
        </EmptyTitle>
        <EmptyDescription>
          An unexpected error occurred. Try again, it might be temporary.
        </EmptyDescription>
        {error.digest && (
          <p className="font-mono text-muted-foreground text-xs">
            Error ID: {error.digest}
          </p>
        )}
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => unstable_retry()}>
          <RotateCcw aria-hidden="true" />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}
