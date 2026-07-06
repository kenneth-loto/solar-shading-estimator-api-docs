import cn from "cnfast";
import { MoveRightIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appName, gitConfig } from "@/lib/shared";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      {/* Top Pill Accent */}
      <div className="mb-4">
        <Badge variant="secondary" className={cn("px-4 py-3")}>
          v1.0 · OpenAPI 3.0
        </Badge>
      </div>

      {/* Hero Header */}
      <h1 className="mb-6 font-black text-4xl text-foreground tracking-tight sm:text-5xl md:text-6xl">
        {appName}
      </h1>

      {/* Hero Description */}
      <p className="mb-8 max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg">
        Estimate realistic solar energy production by combining NASA POWER
        irradiance data, PVWatts baseline estimates, and a simplified
        sun-position vs. obstruction shading model.
      </p>

      {/* Action Buttons */}
      <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/docs"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          Read the docs
          <MoveRightIcon />
        </Link>

        <Link
          href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "lg" }),
            "gap-2 border border-transparent hover:border-border",
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            width="1em"
            height="1em"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
          GitHub
        </Link>
      </div>

      {/* Feature Grid Section */}
      <div className="grid w-full grid-cols-1 gap-6 text-left md:grid-cols-3">
        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="font-bold text-card-foreground text-lg">
              Real data sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              NASA POWER irradiance data and PVWatts baseline estimates, not
              synthetic numbers.
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="font-bold text-card-foreground text-lg">
              Shading-aware
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Accounts for obstructions blocking sunlight, not just an idealized
              unobstructed roof.
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2">
          <CardHeader>
            <CardTitle className="font-bold text-card-foreground text-lg">
              Simple integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Straightforward REST endpoints with a full OpenAPI schema and
              interactive playground.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
