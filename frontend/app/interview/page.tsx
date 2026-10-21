import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function InterviewPage() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Interview</CardTitle>
        <CardDescription>
          The mock interview room will live here. Resume upload, spoken answers,
          and scoring are not wired yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        Use this page as a placeholder while the typed API client and design
        system land.
      </CardContent>
    </Card>
  );
}
