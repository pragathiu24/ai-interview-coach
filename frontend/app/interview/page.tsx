import { redirect } from "next/navigation";

// Interviews live at /interview/[sessionId]. Start a new one from the resume page.
export default function InterviewIndexPage() {
  redirect("/resume");
}
