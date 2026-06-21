import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-md p-4 sm:p-6">
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← Back to portfolio
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="text-xl font-semibold mb-1">Account</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Signed in as {session.user.email}
        </p>

        <h2 className="text-sm font-medium mb-3">Change password</h2>
        <ChangePasswordForm />
      </div>
    </main>
  );
}
