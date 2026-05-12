import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import ProfileSelector from "../components/ProfileSelector";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "BETALAB Platform",
  description: "Research group management platform",
};

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "People", href: "/people" },
  { name: "Projects", href: "/projects" },
  { name: "Activities", href: "/activities" },
  { name: "Publications", href: "/publications" },
  { name: "Meetings", href: "/meetings" },
  { name: "Master Theses", href: "/master-theses" },
  { name: "Admin", href: "/admin" },
  { name: "Insights", href: "/insights" },
  { name: "Logs", href: "/logs" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-100">
          <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-[#E16000] text-white">
            <div className="flex h-16 items-center px-6 text-xl font-bold">
              BETALAB
            </div>

            <nav className="mt-4 flex-1 space-y-1 px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-white/15"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="border-t border-white/20 p-3">
              <LogoutButton />
            </div>
          </aside>

          <div className="pl-64">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-8">
              <div>
                <p className="text-sm text-gray-500">Research Group Platform</p>
              </div>

              <ProfileSelector />
            </header>

            <main className="p-8">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}