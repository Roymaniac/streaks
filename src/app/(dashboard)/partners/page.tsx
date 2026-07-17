"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface PartnerUser {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface Partnership {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  requesterId: string;
  recipientId: string;
  requester: PartnerUser;
  recipient: PartnerUser;
}

export default function PartnersPage() {
  const { data: session } = useSession();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/partnerships");
    if (res.ok) setPartnerships(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviting(true);

    const res = await fetch("/api/partnerships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });

    setInviting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setInviteError(body.error ?? "Couldn't send invite");
      return;
    }

    setInviteEmail("");
    load();
  }

  async function respond(partnershipId: string, status: "ACCEPTED" | "DECLINED") {
    const res = await fetch(`/api/partnerships/${partnershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  if (loading) {
    return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading…</div>;
  }

  const myId = session?.user?.id;
  const incoming = partnerships.filter((p) => p.status === "PENDING" && p.recipientId === myId);
  const outgoing = partnerships.filter((p) => p.status === "PENDING" && p.requesterId === myId);
  const active = partnerships.filter((p) => p.status === "ACCEPTED");

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: "1.5rem" }}>Partners</h1>

      <form onSubmit={handleInvite} style={{ display: "flex", gap: 8, marginBottom: "2rem" }}>
        <input
          type="email"
          placeholder="Invite by email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={inviting}>
          {inviting ? "Sending…" : "Invite"}
        </button>
      </form>
      {inviteError && (
        <p style={{ color: "#C25B3D", fontSize: 13, marginTop: -12, marginBottom: 16 }}>{inviteError}</p>
      )}

      {incoming.length > 0 && (
        <Section title="Invites for you">
          {incoming.map((p) => (
            <PartnerRow key={p.id} user={p.requester}>
              <button onClick={() => respond(p.id, "ACCEPTED")} style={{ fontSize: 13 }}>
                Accept
              </button>
              <button
                onClick={() => respond(p.id, "DECLINED")}
                style={{ fontSize: 13, background: "none", border: "1px solid var(--border)" }}
              >
                Decline
              </button>
            </PartnerRow>
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title="Sent invites">
          {outgoing.map((p) => (
            <PartnerRow key={p.id} user={p.recipient}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Pending</span>
            </PartnerRow>
          ))}
        </Section>
      )}

      <Section title="Your partners">
        {active.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            No partners yet — invite someone above to start keeping each other accountable.
          </p>
        ) : (
          active.map((p) => {
            const partner = p.requesterId === myId ? p.recipient : p.requester;
            return <PartnerRow key={p.id} user={partner} />;
          })
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function PartnerRow({ user, children }: { user: PartnerUser; children?: React.ReactNode }) {
  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--surface-1)",
        borderRadius: 12,
        padding: "0.75rem 1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--bg-accent, #E1F5EE)",
            color: "var(--text-accent, #0F6E56)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {initials}
        </div>
        <div>
          <p style={{ fontSize: 14, margin: 0 }}>{user.name ?? user.email}</p>
        </div>
      </div>
      {children && <div style={{ display: "flex", gap: 6 }}>{children}</div>}
    </div>
  );
}