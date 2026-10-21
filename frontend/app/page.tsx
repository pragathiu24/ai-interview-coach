import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Practice with a calm coach</CardTitle>
          <CardDescription>
            Upload a resume, answer spoken questions, and compare retries against
            the first take. All AI calls go through the FastAPI backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Start in mock mode with{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            NEXT_PUBLIC_USE_MOCKS=true
          </code>{" "}
          while the local model is warming up.
        </CardContent>
        <CardFooter>
          <Link href="/interview" className={buttonVariants()}>
            Go to interview
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
