class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private tokens: number;
  private lastRefill: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.tokens = maxRequests;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor((elapsed / this.windowMs) * this.maxRequests);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  async waitForToken(): Promise<void> {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    // Calculate how long to wait for the next token
    const tokensNeeded = 1;
    const waitMs = Math.ceil((tokensNeeded / this.maxRequests) * this.windowMs);

    await new Promise((resolve) => setTimeout(resolve, waitMs));

    this.refill();
    this.tokens--;
  }
}

const geminiRateLimit = parseInt(process.env.GEMINI_RATE_LIMIT ?? "15", 10);
const openaiRateLimit = parseInt(process.env.OPENAI_RATE_LIMIT ?? "60", 10);

export const geminiLimiter = new RateLimiter(geminiRateLimit, 60_000);
export const openaiLimiter = new RateLimiter(openaiRateLimit, 60_000);
