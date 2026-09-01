const repositoryNamePattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function normalizeRepository(repository: unknown): string | null {
  if (typeof repository !== "string") {
    return null;
  }

  const value = repository.trim();

  if (repositoryNamePattern.test(value)) {
    return value;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== "github.com" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    const pathSegments = url.pathname.split("/").filter(Boolean);

    if (pathSegments.length !== 2) {
      return null;
    }

    const normalized = pathSegments.join("/");

    return repositoryNamePattern.test(normalized) ? normalized : null;
  } catch {
    return null;
  }
}
