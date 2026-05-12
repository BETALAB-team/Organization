"use client";

import { useEffect, useMemo, useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import {
  Activity,
  ActivityPayload,
  ActivityStage,
  archiveActivity,
  createActivity,
  getActivities,
  getActivityStages,
  getPeople,
  getProjects,
  getPublications,
  getResearchFields,
  Person,
  Project,
  Publication,
  ResearchField,
  updateActivity,
} from "@/lib/api";

type ActivityFormState = {
  title: string;
  field_id: string;
  description: string;
  current_stage_id: string;
  main_assignee_person_id: string;
  supervisor_person_id: string;
  collaborator_ids: string[];
  project_ids: string[];
  publication_ids: string[];
  deadlines: Record<string, string>;
};

const emptyForm: ActivityFormState = {
  title: "",
  field_id: "",
  description: "",
  current_stage_id: "",
  main_assignee_person_id: "",
  supervisor_person_id: "",
  collaborator_ids: [],
  project_ids: [],
  publication_ids: [],
  deadlines: {},
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [fields, setFields] = useState<ResearchField[]>([]);
  const [stages, setStages] = useState<ActivityStage[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [form, setForm] = useState<ActivityFormState>(emptyForm);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [
        activityData,
        peopleData,
        projectData,
        publicationData,
        fieldData,
        stageData,
      ] = await Promise.all([
        getActivities(),
        getPeople(),
        getProjects(),
        getPublications(),
        getResearchFields(),
        getActivityStages(),
      ]);

      setActivities(activityData);
      setPeople(peopleData);
      setProjects(projectData);
      setPublications(publicationData);
      setFields(fieldData);
      setStages(stageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredActivities = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return activities;
    }

    return activities.filter((activity) => {
      return [
        activity.activity_code,
        activity.title,
        activity.field_name,
        activity.current_stage_name,
        activity.main_assignee_name,
        activity.supervisor_name,
        activity.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [activities, search]);

  function toggleValue(values: string[], value: string) {
    if (values.includes(value)) {
      return values.filter((item) => item !== value);
    }

    return [...values, value];
  }

  function openCreateForm() {
    const defaultStage = stages[0]?.id || "";
    const defaultField = fields[0]?.id || "";

    setSelectedActivity(null);
    setForm({
      ...emptyForm,
      field_id: defaultField,
      current_stage_id: defaultStage,
      deadlines: Object.fromEntries(stages.map((stage) => [stage.id, ""])),
    });
    setFormOpen(true);
  }

  function openEditForm(activity: Activity) {
    setSelectedActivity(activity);

    const deadlineMap = Object.fromEntries(stages.map((stage) => [stage.id, ""]));

    for (const deadline of activity.deadlines) {
      deadlineMap[deadline.activity_stage_id] = deadline.deadline_optional || "";
    }

    setForm({
      title: activity.title,
      field_id: activity.field_id,
      description: activity.description || "",
      current_stage_id: activity.current_stage_id,
      main_assignee_person_id: activity.main_assignee_person_id,
      supervisor_person_id: activity.supervisor_person_id,
      collaborator_ids: activity.collaborators.map((person) => person.id),
      project_ids: activity.projects.map((project) => project.id),
      publication_ids: activity.publications.map((publication) => publication.id),
      deadlines: deadlineMap,
    });

    setFormOpen(true);
  }

  function openDetail(activity: Activity) {
    setSelectedActivity(activity);
    setDetailOpen(true);
  }

  function openArchive(activity: Activity) {
    setSelectedActivity(activity);
    setArchiveOpen(true);
  }

  function makePayload(): ActivityPayload {
    return {
      title: form.title,
      field_id: form.field_id,
      description: form.description || null,
      current_stage_id: form.current_stage_id,
      main_assignee_person_id: form.main_assignee_person_id,
      supervisor_person_id: form.supervisor_person_id,
      collaborator_ids: form.collaborator_ids,
      project_ids: form.project_ids,
      publication_ids: form.publication_ids,
      deadlines: stages.map((stage) => ({
        activity_stage_id: stage.id,
        deadline_optional: form.deadlines[stage.id] || null,
      })),
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      const payload = makePayload();

      if (selectedActivity) {
        await updateActivity(selectedActivity.id, payload);
      } else {
        await createActivity(payload);
      }

      setFormOpen(false);
      setSelectedActivity(null);
      setForm(emptyForm);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save activity.");
    }
  }

  async function handleArchive() {
    if (!selectedActivity) {
      return;
    }

    try {
      setError("");
      await archiveActivity(selectedActivity.id);
      setArchiveOpen(false);
      setSelectedActivity(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive activity.");
    }
  }

  const currentStageOrdering =
    stages.find((stage) => stage.id === form.current_stage_id)?.ordering || 0;

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Activities</h1>
          <p className="mt-2 text-gray-600">
            Track research activities, stages, deadlines, and linked outputs.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white hover:bg-[#C95500]"
        >
          Create activity
        </button>
      </div>

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search activities..."
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
          Loading activities...
        </div>
      ) : (
        <DataTable<Activity>
          data={filteredActivities}
          emptyMessage="No activities found."
          columns={[
            {
              key: "activity_code",
              header: "ID",
              render: (activity) => (
                <button
                  onClick={() => openDetail(activity)}
                  className="font-medium text-[#E16000] hover:underline"
                >
                  {activity.activity_code}
                </button>
              ),
            },
            {
              key: "title",
              header: "Title",
              render: (activity) => activity.title,
            },
            {
              key: "field_name",
              header: "Field",
              render: (activity) => activity.field_name || "-",
            },
            {
              key: "current_stage_name",
              header: "Stage",
              render: (activity) => (
                <StatusBadge label={activity.current_stage_name || "-"} />
              ),
            },
            {
              key: "main_assignee_name",
              header: "Assignee",
              render: (activity) => activity.main_assignee_name || "-",
            },
            {
              key: "actions",
              header: "Actions",
              render: (activity) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(activity)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => openArchive(activity)}
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
        title={selectedActivity ? "Edit activity" : "Create activity"}
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Field
              </span>
              <select
                value={form.field_id}
                onChange={(event) => setForm({ ...form, field_id: event.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              >
                <option value="">Select field</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name} ({field.prefix})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Current stage
              </span>
              <select
                value={form.current_stage_id}
                onChange={(event) =>
                  setForm({ ...form, current_stage_id: event.target.value })
                }
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              >
                <option value="">Select stage</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.ordering}. {stage.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Main assignee
              </span>
              <select
                value={form.main_assignee_person_id}
                onChange={(event) =>
                  setForm({ ...form, main_assignee_person_id: event.target.value })
                }
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              >
                <option value="">Select person</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Supervisor
              </span>
              <select
                value={form.supervisor_person_id}
                onChange={(event) =>
                  setForm({ ...form, supervisor_person_id: event.target.value })
                }
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              >
                <option value="">Select person</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">
              Collaborators
            </legend>
            <div className="grid gap-2 md:grid-cols-2">
              {people.map((person) => (
                <label key={person.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.collaborator_ids.includes(person.id)}
                    onChange={() =>
                      setForm({
                        ...form,
                        collaborator_ids: toggleValue(form.collaborator_ids, person.id),
                      })
                    }
                  />
                  {person.full_name}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">
              Linked projects
            </legend>
            <div className="grid gap-2 md:grid-cols-2">
              {projects.map((project) => (
                <label key={project.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.project_ids.includes(project.id)}
                    onChange={() =>
                      setForm({
                        ...form,
                        project_ids: toggleValue(form.project_ids, project.id),
                      })
                    }
                  />
                  {project.title}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">
              Linked publications optional
            </legend>
            {publications.length === 0 ? (
              <p className="text-sm text-gray-500">No publications available yet.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {publications.map((publication) => (
                  <label
                    key={publication.id}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.publication_ids.includes(publication.id)}
                      onChange={() =>
                        setForm({
                          ...form,
                          publication_ids: toggleValue(
                            form.publication_ids,
                            publication.id
                          ),
                        })
                      }
                    />
                    {publication.publication_code} — {publication.title}
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">
              Stage deadlines
            </legend>

            <div className="space-y-3">
              {stages.map((stage) => {
                const inactive = stage.ordering < currentStageOrdering;

                return (
                  <label
                    key={stage.id}
                    className={`grid gap-2 text-sm md:grid-cols-[1fr_180px] md:items-center ${
                      inactive ? "text-gray-400" : "text-gray-700"
                    }`}
                  >
                    <span>
                      {stage.ordering}. {stage.name}
                      {inactive ? " (past stage)" : ""}
                    </span>

                    <input
                      type="date"
                      disabled={inactive}
                      value={form.deadlines[stage.id] || ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          deadlines: {
                            ...form.deadlines,
                            [stage.id]: event.target.value,
                          },
                        })
                      }
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000] disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

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
        title="Activity detail"
        onClose={() => setDetailOpen(false)}
      >
        {selectedActivity && (
          <div className="space-y-5 text-sm text-gray-700">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">ID</p>
              <p className="mt-1 font-semibold text-[#E16000]">
                {selectedActivity.activity_code}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Title</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {selectedActivity.title}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Field</p>
                <p>{selectedActivity.field_name || "-"}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">Stage</p>
                <StatusBadge label={selectedActivity.current_stage_name || "-"} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Main assignee
                </p>
                <p>{selectedActivity.main_assignee_name || "-"}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Supervisor
                </p>
                <p>{selectedActivity.supervisor_name || "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Collaborators
              </p>
              <p>
                {selectedActivity.collaborators.length
                  ? selectedActivity.collaborators.map((person) => person.full_name).join(", ")
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Linked projects
              </p>
              <p>
                {selectedActivity.projects.length
                  ? selectedActivity.projects.map((project) => project.title).join(", ")
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Linked publications
              </p>
              <p>
                {selectedActivity.publications.length
                  ? selectedActivity.publications
                      .map((publication) => `${publication.publication_code} ${publication.title}`)
                      .join(", ")
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Stage deadlines
              </p>
              <div className="mt-2 space-y-1">
                {selectedActivity.deadlines.length ? (
                  selectedActivity.deadlines.map((deadline) => (
                    <div key={deadline.id || deadline.activity_stage_id} className="flex justify-between border-b border-gray-100 py-1">
                      <span>{deadline.stage_name}</span>
                      <span>{deadline.deadline_optional || "-"}</span>
                    </div>
                  ))
                ) : (
                  <p>-</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Last presented
              </p>
              <p>{selectedActivity.last_presented_at_optional || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Description
              </p>
              <p className="whitespace-pre-wrap">
                {selectedActivity.description || "-"}
              </p>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive activity"
        message={`Archive "${selectedActivity?.title}"? It will disappear from the normal activity list.`}
        confirmLabel="Archive"
        onCancel={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
      />
    </div>
  );
}