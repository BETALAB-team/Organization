"use client";

export default function LogoutButton() {
  async function logout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  return (
    <button
      onClick={logout}
      className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-50"
    >
      Logout
    </button>
  );
}