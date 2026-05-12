"use client";

import { useEffect, useMemo, useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import {
  archiveProject,
  createProject,
  getProjects,
  Project,
  updateProject,
} from "@/lib/api";

const statusOptions = ["Applied", "Granted", "Rejected", "Completed"];

type ProjectFormState = {
  title: string;
  status: string;
  description: string;
  funding_body_optional: string;
  start_date_optional: string;
  end_date_optional: string;
};

const emptyForm: ProjectFormState = {
  title: "",
  status: "Applied",
  description: "",
  funding_body_optional: "",
  start_date_optional: "",
  end_date_optional: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormState>(emptyForm);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return projects;
    }

    return projects.filter((project) => {
      return [
        project.title,
        project.status,
        project.description,
        project.funding_body_optional,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [projects, search]);

  function openCreateForm() {
    setSelectedProject(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditForm(project: Project) {
    setSelectedProject(project);
    setForm({
      title: project.title,
      status: project.status,
      description: project.description || "",
      funding_body_optional: project.funding_body_optional || "",
      start_date_optional: project.start_date_optional || "",
      end_date_optional: project.end_date_optional || "",
    });
    setFormOpen(true);
  }

  function openDetail(project: Project) {
    setSelectedProject(project);
    setDetailOpen(true);
  }

  function openArchive(project: Project) {
    setSelectedProject(project);
    setArchiveOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      title: form.title,
      status: form.status,
      description: form.description || null,
      funding_body_optional: form.funding_body_optional || null,
      start_date_optional: form.start_date_optional || null,
      end_date_optional: form.end_date_optional || null,
    };

    try {
      setError("");

      if (selectedProject) {
        await updateProject(selectedProject.id, payload);
      } else {
        await createProject(payload);
      }

      setFormOpen(false);
      setSelectedProject(null);
      setForm(emptyForm);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project.");
    }
  }

  async function handleArchive() {
    if (!selectedProject) {
      return;
    }

    try {
      setError("");
      await archiveProject(selectedProject.id);
      setArchiveOpen(false);
      setSelectedProject(null);
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive project.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">
            Track granted, applied, completed, and rejected projects.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white hover:bg-[#C95500]"
        >
          Create project
        </button>
      </div>

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search projects..."
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
          Loading projects...
        </div>
      ) : (
        <DataTable<Project>
          data={filteredProjects}
          emptyMessage="No projects found."
          columns={[
            {
              key: "title",
              header: "Title",
              render: (project) => (
                <button
                  onClick={() => openDetail(project)}
                  className="font-medium text-[#E16000] hover:underline"
                >
                  {project.title}
                </button>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (project) => <StatusBadge label={project.status} />,
            },
            {
              key: "funding_body_optional",
              header: "Funding body",
              render: (project) => project.funding_body_optional || "-",
            },
            {
              key: "actions",
              header: "Actions",
              render: (project) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(project)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => openArchive(project)}
                    className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                  >
                    Archive
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <FormModal
        open={formOpen}
        title={selectedProject ? "Edit project" : "Create project"}
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </span>
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Funding body
            </span>
            <input
              value={form.funding_body_optional}
              onChange={(event) =>
                setForm({
                  ...form,
                  funding_body_optional: event.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Start date
              </span>
              <input
                type="date"
                value={form.start_date_optional}
                onChange={(event) =>
                  setForm({
                    ...form,
                    start_date_optional: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                End date
              </span>
              <input
                type="date"
                value={form.end_date_optional}
                onChange={(event) =>
                  setForm({
                    ...form,
                    end_date_optional: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white hover:bg-[#C95500]"
            >
              Save
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal
        open={detailOpen}
        title="Project detail"
        onClose={() => setDetailOpen(false)}
      >
        {selectedProject && (
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Title
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {selectedProject.title}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Status
              </p>
              <div className="mt-1">
                <StatusBadge label={selectedProject.status} />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Funding body
              </p>
              <p>{selectedProject.funding_body_optional || "-"}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Start date
                </p>
                <p>{selectedProject.start_date_optional || "-"}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  End date
                </p>
                <p>{selectedProject.end_date_optional || "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Description
              </p>
              <p className="whitespace-pre-wrap">
                {selectedProject.description || "-"}
              </p>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive project"
        message={`Archive "${selectedProject?.title}"? It will disappear from the normal project list.`}
        confirmLabel="Archive"
        onCancel={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
      />
    </div>
  );
}