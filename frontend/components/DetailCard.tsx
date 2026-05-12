type DetailCardProps = {
  title: string;
  children: React.ReactNode;
};

export default function DetailCard({ title, children }: DetailCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm text-gray-700">{children}</div>
    </section>
  );
}