"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          ⚠️ Application Error
        </h1>
        <pre style={{ background: "#f3f4f6", padding: "1rem", borderRadius: "0.5rem", textAlign: "left", fontSize: "0.8rem", overflowX: "auto", marginBottom: "1rem" }}>
          {error?.message || "Unknown error"}
          {"\n"}
          {error?.stack}
        </pre>
        {error?.digest && (
          <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "1rem" }}>
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{ background: "#22c55e", color: "white", fontWeight: "bold", padding: "0.75rem 1.5rem", borderRadius: "0.75rem", border: "none", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
