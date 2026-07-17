import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // server-side check — runs before any client JS, so there's no flash of
  // protected content before redirecting an unauthenticated visitor
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <a href="/dashboard" style={{ fontWeight: 600 }}>
          Streaks
        </a>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/partners" style={{ fontSize: 14 }}>
            Partners
          </a>
          <SignOutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}