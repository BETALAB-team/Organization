"use client";

import { useEffect, useMemo, useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import {
  Activity,
  archiveMasterThesis,
  assignMasterThesis,
  completeMasterThesis,
  createMasterThesis,
  getActivities,
  getMasterTheses,
  getPeople,
  getProjects,
  MasterThesis,
  Person,
  Project,
  updateMasterThesis,
} from "@/lib/api";

type ThesisFormState = {
  title: string;
  keywords: string;
  related_activity_optional: string;
  related_project_optional: string;
  description: string;
  prerequisites: string;
  created_by_person_id: string;
};

type AssignFormState = {
  thesis_id: string;
  student_name: string;
  supervisor_ids: string[];
  assigned_at: string;
};

const emptyThesisForm: ThesisFormState = {
  title: "",
  keywords: "",
  related_activity_optional: "",
  related_project_optional: "",
  description: "",
  prerequisites: "",
  created_by_person_id: "",
};

const emptyAssignForm: AssignFormState = {
  thesis_id: "",
  student_name: "",
  supervisor_ids: [],
  assigned_at: "",
};

export default function MasterThesesPage() {
  const [theses, setTheses] = useState<MasterThesis[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  const [selectedThesis, setSelectedThesis] = useState<MasterThesis | null>(null);
  const [form, setForm] = useState<ThesisFormState>(emptyThesisForm);
  const [assignForm, setAssignForm] = useState<AssignFormState>(emptyAssignForm);
  const [completedAt, setCompletedAt] = useState("");

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [thesisData, peopleData, projectData, activityData] =
        await Promise.all([
          getMasterTheses(),
          getPeople(),
          getProjects(),
          getActivities(),
        ]);

      setTheses(thesisData);
      setPeople(peopleData);
      setProjects(projectData);
      setActivities(activityData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load master theses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredTheses = useMemo(() => {
    const query = search.toLowerCase().trim();

    return theses.filter((thesis) => {
      const matchesStatus = statusFilter ? thesis.status === statusFilter : true;

      const matchesSearch = query
        ? [
            thesis.thesis_code,
            thesis.title,
            thesis.keywords,
            thesis.related_activity_code,
            thesis.related_activity_title,
            thesis.related_project_title,
            thesis.student_name_optional,
            thesis.created_by_name,
            thesis.description,
            thesis.prerequisites,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;

      return matchesStatus && matchesSearch;
    });
  }, [theses, search, statusFilter]);

  function toggleValue(values: string[], value: string) {
    if (values.includes(value)) {
      return values.filter((item) => item !== value);
    }

    return [...values, value];
  }

  function openCreateForm() {
    setSelectedThesis(null);
    setForm({
      ...emptyThesisForm,
      created_by_person_id: people[0]?.id || "",
    });
    setFormOpen(true);
  }

  function openEditForm(thesis: MasterThesis) {
    setSelectedThesis(thesis);
    setForm({
      title: thesis.title,
      keywords: thesis.keywords || "",
      related_activity_optional: thesis.related_activity_optional || "",
      related_project_optional: thesis.related_project_optional || "",
      description: thesis.description || "",
      prerequisites: thesis.prerequisites || "",
      created_by_person_id: thesis.created_by_person_id || "",
    });
    setFormOpen(true);
  }

  function openAssignForm(thesis: MasterThesis) {
    setSelectedThesis(thesis);
    setAssignForm({
      thesis_id: thesis.id,
      student_name: "",
      supervisor_ids: [],
      assigned_at: new Date().toISOString().slice(0, 10),
    });
    setAssignOpen(true);
  }

  function openCompleteForm(thesis: MasterThesis) {
    setSelectedThesis(thesis);
    setCompletedAt(new Date().toISOString().slice(0, 10));
    setCompleteOpen(true);
  }

  function openDetail(thesis: MasterThesis) {
    setSelectedThesis(thesis);
    setDetailOpen(true);
  }

  function openArchive(thesis: MasterThesis) {
    setSelectedThesis(thesis);
    setArchiveOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      title: form.title,
      keywords: form.keywords || null,
      related_activity_optional: form.related_activity_optional || null,
      related_project_optional: form.related_project_optional || null,
      description: form.description || null,
      prerequisites: form.prerequisites || null,
      created_by_person_id: form.created_by_person_id || null,
    };

    try {
      setError("");

      if (selectedThesis) {
        await updateMasterThesis(selectedThesis.id, payload);
      } else {
        await createMasterThesis(payload);
      }

      setFormOpen(false);
      setSelectedThesis(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save thesis.");
    }
  }

  async function handleAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedThesis) {
      return;
    }

    try {
      setError("");

      await assignMasterThesis(selectedThesis.id, {
        student_name: assignForm.student_name,
        supervisor_ids: assignForm.supervisor_ids,
        assigned_at: assignForm.assigned_at || null,
      });

      setAssignOpen(false);
      setSelectedThesis(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign thesis.");
    }
  }

  async function handleComplete() {
    if (!selectedThesis) {
      return;
    }

    try {
      setError("");

      await completeMasterThesis(selectedThesis.id, {
        completed_at: completedAt || null,
      });

      setCompleteOpen(false);
      setSelectedThesis(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete thesis.");
    }
  }

  async function handleArchive() {
    if (!selectedThesis) {
      return;
    }

    try {
      setError("");
      await archiveMasterThesis(selectedThesis.id);
      setArchiveOpen(false);
      setSelectedThesis(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive thesis.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Master Theses</h1>
          <p className="mt-2 text-gray-600">
            Thesis bank, thesis ideas, assignments, and supervision.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white hover:bg-[#C95500]"
        >
          Create thesis idea
        </button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search thesis bank..."
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
        >
          <option value="">All statuses</option>
          <option value="Available">Available</option>
          <option value="Assigned">Assigned</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
          Loading thesis bank...
        </div>
      ) : (
        <DataTable<MasterThesis>
          data={filteredTheses}
          emptyMessage="No thesis ideas found."
          columns={[
            {
              key: "thesis_code",
              header: "ID",
              render: (thesis) => (
                <button
                  onClick={() => openDetail(thesis)}
                  className="font-medium text-[#E16000] hover:underline"
                >
                  {thesis.thesis_code}
                </button>
              ),
            },
            {
              key: "title",
              header: "Title",
              render: (thesis) => thesis.title,
            },
            {
              key: "status",
              header: "Status",
              render: (thesis) => <StatusBadge label={thesis.status} />,
            },
            {
              key: "student_name_optional",
              header: "Student",
              render: (thesis) => thesis.student_name_optional || "-",
            },
            {
              key: "related_project_title",
              header: "Project",
              render: (thesis) => thesis.related_project_title || "-",
            },
            {
              key: "actions",
              header: "Actions",
              render: (thesis) => (
                <div className="flex flex-wrap gap-2">
                  {thesis.status === "Available" && (
                    <>
                      <button
                        onClick={() => openEditForm(thesis)}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => openAssignForm(thesis)}
                        className="rounded-lg bg-[#E16000] px-3 py-1 text-xs font-medium text-white"
                      >
                        Assign
                      </button>
                    </>
                  )}

                  {thesis.status === "Assigned" && (
                    <button
                      onClick={() => openCompleteForm(thesis)}
                      className="rounded-lg bg-green-700 px-3 py-1 text-xs font-medium text-white"
                    >
                      Complete
                    </button>
                  )}

                  <button
                    onClick={() => openArchive(thesis)}
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
        title={selectedThesis ? "Edit thesis idea" : "Create thesis idea"}
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </span>
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Keywords
            </span>
            <input
              value={form.keywords}
              onChange={(event) =>
                setForm({ ...form, keywords: event.target.value })
              }
              placeholder="heat pumps, GIS, energy retrofit"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Related activity optional
              </span>
              <select
                value={form.related_activity_optional}
                onChange={(event) =>
                  setForm({
                    ...form,
                    related_activity_optional: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              >
                <option value="">None</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.activity_code} — {activity.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Related project optional
              </span>
              <select
                value={form.related_project_optional}
                onChange={(event) =>
                  setForm({
                    ...form,
                    related_project_optional: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              >
                <option value="">None</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Created by
            </span>
            <select
              value={form.created_by_person_id}
              onChange={(event) =>
                setForm({ ...form, created_by_person_id: event.target.value })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            >
              <option value="">None</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </label>

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

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Prerequisites
            </span>
            <textarea
              value={form.prerequisites}
              onChange={(event) =>
                setForm({ ...form, prerequisites: event.target.value })
              }
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white"
            >
              Save
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal
        open={assignOpen}
        title="Assign thesis"
        onClose={() => setAssignOpen(false)}
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Student name
            </span>
            <input
              value={assignForm.student_name}
              onChange={(event) =>
                setAssignForm({ ...assignForm, student_name: event.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Assigned date
            </span>
            <input
              type="date"
              value={assignForm.assigned_at}
              onChange={(event) =>
                setAssignForm({ ...assignForm, assigned_at: event.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </label>

          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">
              Supervisors
            </legend>
            <div className="grid gap-2 md:grid-cols-2">
              {people.map((person) => (
                <label
                  key={person.id}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={assignForm.supervisor_ids.includes(person.id)}
                    onChange={() =>
                      setAssignForm({
                        ...assignForm,
                        supervisor_ids: toggleValue(
                          assignForm.supervisor_ids,
                          person.id
                        ),
                      })
                    }
                  />
                  {person.full_name}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white"
            >
              Assign
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal
        open={detailOpen}
        title="Thesis detail"
        onClose={() => setDetailOpen(false)}
      >
        {selectedThesis && (
          <div className="space-y-5 text-sm text-gray-700">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">ID</p>
              <p className="font-semibold text-[#E16000]">
                {selectedThesis.thesis_code}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Title
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedThesis.title}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Status
              </p>
              <StatusBadge label={selectedThesis.status} />
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Keywords
              </p>
              <p>{selectedThesis.keywords || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Related activity
              </p>
              <p>
                {selectedThesis.related_activity_code
                  ? `${selectedThesis.related_activity_code} — ${selectedThesis.related_activity_title}`
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Related project
              </p>
              <p>{selectedThesis.related_project_title || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Student
              </p>
              <p>{selectedThesis.student_name_optional || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Supervisors
              </p>
              <p>
                {selectedThesis.supervisors.length
                  ? selectedThesis.supervisors
                      .map((person) => person.full_name)
                      .join(", ")
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Description
              </p>
              <p className="whitespace-pre-wrap">
                {selectedThesis.description || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Prerequisites
              </p>
              <p className="whitespace-pre-wrap">
                {selectedThesis.prerequisites || "-"}
              </p>
            </div>
          </div>
        )}
      </FormModal>

      <FormModal
        open={completeOpen}
        title="Complete thesis"
        onClose={() => setCompleteOpen(false)}
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Completion date
            </span>
            <input
              type="date"
              value={completedAt}
              onChange={(event) => setCompletedAt(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </label>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCompleteOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>

            <button
              onClick={handleComplete}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white"
            >
              Mark completed
            </button>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive thesis"
        message={`Archive "${selectedThesis?.title}"? It will disappear from the normal thesis bank.`}
        confirmLabel="Archive"
        onCancel={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
      />
    </div>
  );
}