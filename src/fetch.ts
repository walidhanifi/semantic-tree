export class FetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function fetchHTML(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new FetchError(
      `Upstream server returned HTTP ${response.status}`,
      502,
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("text/html")) {
    throw new FetchError("URL did not return HTML content", 422);
  }

  const html = await response.text();
  return html;
}
