"use client";

import { useEffect, useMemo, useState } from "react";

import {
  FullPublication,
  getFullPublications,
  getMasterTheses,
  getPeople,
  getProjects,
  getRoles,
  MasterThesis,
  Person,
  Project,
  Role,
} from "@/lib/api";

type MonthlySubmissionPoint = {
  label: string;
  cumulative: number;
};

export default function InsightsPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [theses, setTheses] = useState<MasterThesis[]>([]);
  const [publications, setPublications] = useState<FullPublication[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [peopleData, rolesData, projectData, thesisData, publicationData] =
        await Promise.all([
          getPeople(),
          getRoles(),
          getProjects(),
          getMasterTheses(),
          getFullPublications(),
        ]);

      setPeople(peopleData);
      setRoles(rolesData);
      setProjects(projectData);
      setTheses(thesisData);
      setPublications(publicationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load insights.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const roleNameById = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role.name]));
  }, [roles]);

  const peoplePerRole = useMemo(() => {
    const counts = new Map<string, number>();

    for (const person of people) {
      const roleName = roleNameById.get(person.role_id) || "Unknown";
      counts.set(roleName, (counts.get(roleName) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => a.role.localeCompare(b.role));
  }, [people, roleNameById]);

  const activeProjectsCount = useMemo(() => {
    return projects.filter((project) => project.status === "Granted").length;
  }, [projects]);

  const appliedProjectsCount = useMemo(() => {
    return projects.filter((project) => project.status === "Applied").length;
  }, [projects]);

  const availableThesesCount = useMemo(() => {
    return theses.filter((thesis) => thesis.status === "Available").length;
  }, [theses]);

  const assignedThesesCount = useMemo(() => {
    return theses.filter((thesis) => thesis.status === "Assigned").length;
  }, [theses]);

  const expectedJournalSubmissions = useMemo(() => {
    return buildCumulativeJournalSubmissionSeries(publications, 12);
  }, [publications]);

  const maxSubmissionValue = Math.max(
    1,
    ...expectedJournalSubmissions.map((item) => item.cumulative)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Insights</h1>
        <p className="mt-2 text-gray-600">
          Overview of people, projects, theses, and expected journal submissions.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
          Loading insights...
        </div>
      ) : (
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-4">
            <InsightCard title="Active projects" value={activeProjectsCount} />
            <InsightCard title="Applied projects" value={appliedProjectsCount} />
            <InsightCard title="Available theses" value={availableThesesCount} />
            <InsightCard title="Assigned theses" value={assignedThesesCount} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              People per role
            </h2>

            <div className="mt-4 space-y-3">
              {peoplePerRole.length === 0 ? (
                <p className="text-sm text-gray-500">No people available.</p>
              ) : (
                peoplePerRole.map((item) => (
                  <div
                    key={item.role}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {item.role}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
                      {item.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Expected journal submissions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Cumulative count of journal articles expected to reach the
                submission deadline by each month.
              </p>
            </div>

            <div className="space-y-3">
              {expectedJournalSubmissions.map((point) => (
                <div
                  key={point.label}
                  className="grid grid-cols-[90px_1fr_40px] items-center gap-3"
                >
                  <span className="text-sm text-gray-600">{point.label}</span>

                  <div className="h-8 overflow-hidden rounded-lg bg-gray-100">
                    <div
                      className="h-full rounded-lg bg-[#E16000]"
                      style={{
                        width: `${(point.cumulative / maxSubmissionValue) * 100}%`,
                      }}
                    />
                  </div>

                  <span className="text-right text-sm font-semibold text-gray-800">
                    {point.cumulative}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function InsightCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function buildCumulativeJournalSubmissionSeries(
  publications: FullPublication[],
  numberOfMonths: number
): MonthlySubmissionPoint[] {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const journalSubmissionDeadlines = publications
    .filter((publication) => publication.type === "Journal")
    .flatMap((publication) => publication.deadlines || [])
    .filter((deadline) => {
      const statusName = deadline.status_name?.toLowerCase().trim() || "";
      return statusName.includes("submitted") || statusName.includes("submission");
    })
    .map((deadline) => deadline.deadline_optional)
    .filter((deadline): deadline is string => Boolean(deadline))
    .map((deadline) => new Date(deadline));

  const points: MonthlySubmissionPoint[] = [];

  for (let index = 0; index < numberOfMonths; index += 1) {
    const monthStart = new Date(
      firstMonth.getFullYear(),
      firstMonth.getMonth() + index,
      1
    );

    const monthEnd = new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const cumulative = journalSubmissionDeadlines.filter((deadline) => {
      return deadline <= monthEnd;
    }).length;

    points.push({
      label: monthStart.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      }),
      cumulative,
    });
  }

  return points;
}