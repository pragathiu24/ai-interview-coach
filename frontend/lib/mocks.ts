import type {
  CompareResponse,
  EvaluateRequest,
  EvaluateResponse,
  FollowupResponse,
  Question,
  QuestionsRequest,
  ResumeAnalysis,
} from "@/types/api";

export const mockResumeAnalysis: ResumeAnalysis = {
  candidate_name: "Asha Rao",
  skills: [
    "Python",
    "FastAPI",
    "PostgreSQL",
    "Redis",
    "Docker",
    "AWS",
    "React",
    "Git",
    "pytest",
    "WebSockets",
  ],
  projects: [
    {
      name: "Order Tracker",
      description:
        "Real-time order tracking web app used by warehouse and support teams.",
      technologies: ["FastAPI", "React", "WebSockets", "Redis"],
    },
    {
      name: "Inventory Sync",
      description:
        "Nightly job that reconciles warehouse counts with the catalog and flags mismatches.",
      technologies: ["Python", "PostgreSQL", "AWS ECS"],
    },
  ],
  experience_summary:
    "Software Engineer with experience building REST APIs using Python, FastAPI, and PostgreSQL. Proven ability to optimize performance and manage cloud infrastructure migrations. Recently focused on caching, containerization, and keeping warehouse-facing tools reliable under load.",
  claims_to_verify: [
    "Reduced API latency by 40% by adding Redis caching.",
    "Led migration of 12 services to Docker and AWS ECS.",
    "Order Tracker used by 300 daily users.",
    "Cut inventory mismatch tickets by 25% after Inventory Sync went live.",
  ],
};

export const mockQuestions: Question[] = [
  {
    id: "q1",
    text: "How exactly did adding Redis caching achieve a 40% reduction in API latency?",
    type: "resume",
    related_claim: "Reduced API latency by 40% by adding Redis caching.",
  },
  {
    id: "q2",
    text: "What were the biggest technical challenges when migrating 12 services to Docker and AWS ECS?",
    type: "resume",
    related_claim: "Led migration of 12 services to Docker and AWS ECS.",
  },
  {
    id: "q3",
    text: "When using FastAPI, how would you ensure data consistency across concurrent database transactions in PostgreSQL?",
    type: "technical",
    related_claim: null,
  },
  {
    id: "q4",
    text: "In the Order Tracker, what cache invalidation strategy would you use for updating order status in real time?",
    type: "technical",
    related_claim: null,
  },
  {
    id: "q5",
    text: "Tell me about a time you had to explain a production incident to non-engineers while Order Tracker was under load.",
    type: "behavioral",
    related_claim: "Order Tracker used by 300 daily users.",
  },
  {
    id: "q6",
    text: "Inventory Sync claims it cut mismatch tickets by 25%. How did you measure that, and what did you do when a nightly run failed?",
    type: "resume",
    related_claim:
      "Cut inventory mismatch tickets by 25% after Inventory Sync went live.",
  },
];

export const mockWeakEvaluation: EvaluateResponse = {
  technical_accuracy: {
    score: 3,
    reason:
      "The answer is too vague to confirm any technical accuracy regarding the caching mechanism.",
  },
  specificity: {
    score: 1,
    reason:
      "The answer contains no concrete details, tools, numbers, or examples of the implementation.",
  },
  clarity: {
    score: 5,
    reason:
      "The answer is extremely brief and lacks structure, though it is easy to understand.",
  },
  resume_claim_support: {
    score: 2,
    reason:
      "The answer fails to provide any believable detail to support the specific claim of a 40% latency reduction.",
  },
  missing_points: [
    "The specific caching strategy (e.g., read-through, write-through)",
    "The type of data cached (e.g., frequently accessed read-only data)",
    "The mechanism for cache invalidation",
    "The specific latency metrics before and after the change",
  ],
  stronger_answer:
    "I implemented a read-through caching strategy using Redis to store frequently accessed, read-only data from PostgreSQL. This bypassed expensive database queries, and by setting a short TTL and implementing a write-through mechanism, we achieved the targeted 40% reduction in API latency.",
  needs_followup: true,
  overall_score: 2.8,
};

export const mockMediumEvaluation: EvaluateResponse = {
  technical_accuracy: {
    score: 6,
    reason:
      "Mentions Redis and TTL, which is plausible, but skips how writes stayed consistent with Postgres.",
  },
  specificity: {
    score: 5,
    reason:
      "Names Redis and a cache-aside pattern, but does not include latency numbers, keys, or load-test evidence.",
  },
  clarity: {
    score: 7,
    reason:
      "The answer is easy to follow and has a beginning and end, though it jumps past the measurement step.",
  },
  resume_claim_support: {
    score: 6,
    reason:
      "Supports the Redis claim in outline form, but the 40% figure is asserted rather than shown.",
  },
  missing_points: [
    "Baseline and post-change latency numbers",
    "How keys were named and invalidated on writes",
    "What was intentionally left uncached",
  ],
  stronger_answer:
    "We used cache-aside in FastAPI: GET /orders/{id} checked Redis first, then Postgres. Keys used order:{id} with a 60 second TTL, and POST /orders flushed the key after commit. Locust showed p50 dropping from about 800 ms to 480 ms on the same 300-user mix, which is the 40% we reported.",
  needs_followup: true,
  overall_score: 6.0,
};

export const mockStrongEvaluation: EvaluateResponse = {
  technical_accuracy: {
    score: 9,
    reason:
      "Describes cache-aside, TTL, write invalidation, and measurement in a way that matches FastAPI plus Redis plus Postgres.",
  },
  specificity: {
    score: 9,
    reason:
      "Gives tools (py-spy, Locust), key pattern, TTL, and before/after latency numbers.",
  },
  clarity: {
    score: 9,
    reason:
      "Walks through diagnosis, change, measurement, and trade-off in a clear sequence.",
  },
  resume_claim_support: {
    score: 9,
    reason:
      "The 40% latency claim is backed by 800 ms to 480 ms under the same load.",
  },
  missing_points: [
    "How stampedes were avoided if many keys expired together",
  ],
  stronger_answer:
    "This is already a strong answer. One extra sentence on stampede protection (single-flight or jittered TTLs) would close the last gap.",
  needs_followup: false,
  overall_score: 9.0,
};

export const mockFollowup: FollowupResponse = {
  followup_question:
    "What specific data did you cache, and how did you handle cache invalidation?",
  reason:
    "The candidate failed to describe the scope of the caching strategy or how data freshness was maintained.",
};

export const mockCompare: CompareResponse = {
  first_scores: {
    technical_accuracy: 2,
    specificity: 1,
    clarity: 3,
    resume_claim_support: 2,
  },
  retry_scores: {
    technical_accuracy: 9,
    specificity: 9,
    clarity: 8,
    resume_claim_support: 9,
  },
  newly_covered_points: [
    "Identified Postgres queries as the bottleneck using py-spy",
    "Specified Redis TTL (60 seconds) and invalidation strategy",
    "Provided concrete latency metrics (800ms to 480ms)",
    "Mentioned load testing tool (Locust)",
    "Discussed the trade-off of slightly stale data",
  ],
  still_missing: [""],
  summary:
    "The retry provided a highly detailed and technically accurate explanation, backing up the resume claim with specific tools, metrics, and trade-offs. The first answer was too vague to be useful.",
  deltas: {
    technical_accuracy: 7,
    specificity: 8,
    clarity: 5,
    resume_claim_support: 7,
  },
  overall_first: 2.0,
  overall_retry: 8.8,
  overall_delta: 6.8,
};

export function mockQuestionsResponse(
  request: QuestionsRequest,
): { questions: Question[] } {
  const count = Math.min(Math.max(request.count, 1), mockQuestions.length);
  return { questions: mockQuestions.slice(0, count) };
}

export function mockEvaluationForAnswer(
  request: EvaluateRequest,
): EvaluateResponse {
  const length = request.answer.trim().length;
  if (length < 80) {
    return mockWeakEvaluation;
  }
  if (length < 220) {
    return mockMediumEvaluation;
  }
  return mockStrongEvaluation;
}
