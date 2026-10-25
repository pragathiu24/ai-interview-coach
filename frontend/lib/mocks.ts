import type {
  CompareResponse,
  EvaluateResponse,
  FollowupResponse,
  Question,
  ResumeAnalysis,
} from "@/types/api";

export const mockAnalysis: ResumeAnalysis = {
  candidate_name: "Asha Rao",
  skills: [
    "Python",
    "FastAPI",
    "PostgreSQL",
    "Redis",
    "Docker",
    "AWS ECS",
    "React",
    "WebSockets",
    "Git",
  ],
  projects: [
    {
      name: "Order Tracker",
      description: "Real-time order tracking web app used by about 300 daily users.",
      technologies: ["FastAPI", "React", "WebSockets", "PostgreSQL"],
    },
    {
      name: "Service Migration",
      description: "Moved 12 backend services into Docker containers running on AWS ECS.",
      technologies: ["Docker", "AWS ECS", "GitHub Actions"],
    },
  ],
  experience_summary:
    "Backend developer with two years of experience building REST APIs and improving performance for a retail platform.",
  claims_to_verify: [
    "Reduced API latency by 40% by adding Redis caching",
    "Led migration of 12 services to Docker and AWS ECS",
    "Order Tracker is used by 300 daily users",
  ],
};

export const mockQuestions: Question[] = [
  {
    id: "q1",
    text: "You mention cutting API latency by 40 percent with Redis. How did you measure that, and what exactly did you cache?",
    type: "resume",
    related_claim: "Reduced API latency by 40% by adding Redis caching",
  },
  {
    id: "q2",
    text: "How would you manage database connection pooling in a FastAPI service under heavy load?",
    type: "technical",
    related_claim: null,
  },
  {
    id: "q3",
    text: "Walk me through how you planned the migration of 12 services to AWS ECS. What went wrong along the way?",
    type: "resume",
    related_claim: "Led migration of 12 services to Docker and AWS ECS",
  },
  {
    id: "q4",
    text: "How do WebSockets differ from polling, and how would you scale them for Order Tracker?",
    type: "technical",
    related_claim: null,
  },
  {
    id: "q5",
    text: "Tell me about a time you disagreed with a teammate on a technical decision. How did it end?",
    type: "behavioral",
    related_claim: null,
  },
  {
    id: "q6",
    text: "How would you design cache invalidation for data that changes often?",
    type: "technical",
    related_claim: null,
  },
];

export const mockEvaluations: Record<"weak" | "medium" | "strong", EvaluateResponse> = {
  weak: {
    technical_accuracy: { score: 5, reason: "Caching is mentioned correctly but nothing explains what was cached or how." },
    specificity: { score: 3, reason: "The answer names no tools, numbers or examples." },
    clarity: { score: 5, reason: "Short and understandable, but too thin to follow a line of thought." },
    resume_claim_support: { score: 3, reason: "The answer does not back up the 40 percent claim in any way." },
    missing_points: [
      "How latency was measured before and after",
      "What data was cached and for how long",
      "How stale data was handled",
    ],
    stronger_answer:
      "I profiled the endpoint and found repeated Postgres queries dominating the time. I cached the read-heavy results in Redis with a 60 second TTL and invalidated keys on writes. Median latency dropped from about 800 ms to 480 ms, measured with a load test under the same traffic.",
    needs_followup: true,
    overall_score: 4.0,
  },
  medium: {
    technical_accuracy: { score: 7, reason: "The approach is sound, but invalidation is only touched on briefly." },
    specificity: { score: 6, reason: "Redis and TTLs are named, but there are no measured results." },
    clarity: { score: 7, reason: "Well ordered: problem, solution, outcome." },
    resume_claim_support: { score: 6, reason: "Plausible support for the claim, though the numbers are missing." },
    missing_points: ["Measured before and after latency", "Trade-off of serving slightly stale data"],
    stronger_answer:
      "After profiling, I cached the hottest read queries in Redis with a short TTL and invalidated on writes. I compared p50 latency before and after under the same load, which showed roughly a 40 percent drop, and I accepted up to a minute of staleness for non-critical data.",
    needs_followup: false,
    overall_score: 6.5,
  },
  strong: {
    technical_accuracy: { score: 9, reason: "Correct and complete, including invalidation and consistency trade-offs." },
    specificity: { score: 8, reason: "Names the profiler, the TTL, and before and after numbers." },
    clarity: { score: 9, reason: "Clear structure that is easy to follow aloud." },
    resume_claim_support: { score: 8, reason: "The answer convincingly supports the 40 percent claim." },
    missing_points: ["Mention of cache warm-up after a deploy"],
    stronger_answer:
      "Your answer is already strong. To make it excellent, also mention how you warm the cache after a deploy and how you monitor the hit rate.",
    needs_followup: false,
    overall_score: 8.5,
  },
};

export const sampleAnswers = {
  weak: "I used caching to make it faster and it worked well.",
  medium:
    "I noticed the product endpoint was slow, so I added Redis caching for the most common read queries with a short TTL. It made the API noticeably faster for users, and I cleared the cache whenever the data changed.",
  strong:
    "I profiled the endpoint with py-spy and found repeated Postgres queries dominated the time. I added a Redis cache with a 60 second TTL and invalidated keys on writes. Median latency dropped from about 800 ms to 480 ms, measured with Locust under identical load. The trade-off was up to a minute of stale data for non-critical fields.",
} as const;

export function mockEvaluate(answer: string): EvaluateResponse {
  const length = answer.trim().length;
  if (length < 80) return mockEvaluations.weak;
  if (length < 300) return mockEvaluations.medium;
  return mockEvaluations.strong;
}

export const mockFollowup: FollowupResponse = {
  followup_question: "Which tool did you use to measure latency, and what were the numbers before and after?",
  reason: "The answer gave no concrete measurements.",
};

export const mockCompare: CompareResponse = {
  first_scores: { technical_accuracy: 5, specificity: 3, clarity: 5, resume_claim_support: 3 },
  retry_scores: { technical_accuracy: 8, specificity: 8, clarity: 8, resume_claim_support: 7 },
  deltas: { technical_accuracy: 3, specificity: 5, clarity: 3, resume_claim_support: 4 },
  overall_first: 4.0,
  overall_retry: 7.8,
  overall_delta: 3.8,
  newly_covered_points: [
    "Named the profiling tool",
    "Gave measured before and after latency",
    "Explained cache invalidation on writes",
  ],
  still_missing: ["Trade-offs of serving stale data", "How cache hit rate is monitored"],
  summary:
    "The retry added concrete tools, numbers and an invalidation strategy, which makes the 40 percent claim believable. It still does not discuss the cost of stale data or how the cache is monitored.",
};
