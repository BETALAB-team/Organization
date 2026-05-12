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
          <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:bg-[#E16000] lg:text-white">
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

          <div className="lg:pl-64">
            <header className="sticky top-0 z-10 border-b bg-white">
              <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
                <div>
                  <p className="text-base font-bold text-[#E16000] lg:hidden">
                    BETALAB
                  </p>
                  <p className="text-sm text-gray-500">
                    Research Group Platform
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <ProfileSelector />
                  <div className="hidden sm:block">
                    <LogoutButton />
                  </div>
                </div>
              </div>

              <nav className="flex gap-2 overflow-x-auto border-t px-4 py-2 lg:hidden">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {item.name}
                  </Link>
                ))}

                <div className="shrink-0 sm:hidden">
                  <LogoutButton />
                </div>
              </nav>
            </header>

            <main className="p-3 sm:p-5 lg:p-8">
              <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}