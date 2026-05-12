"use client";

import { useEffect, useMemo, useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import {
  archivePublication,
  createPublication,
  FullPublication,
  getFullPublications,
  getPeople,
  getPublicationStatuses,
  Person,
  PublicationPayload,
  PublicationStatus,
  updatePublication,
} from "@/lib/api";

type PublicationFormState = {
  type: string;
  title: string;
  current_status_id: string;
  main_author_person_id: string;
  supervisor_person_id: string;
  journal_name_optional: string;
  conference_name_optional: string;
  conference_date_optional: string;
  conference_place_optional: string;
  description_optional: string;
  collaborator_ids: string[];
  deadlines: Record<string, string>;
};

const emptyForm: PublicationFormState = {
  type: "Journal",
  title: "",
  current_status_id: "",
  main_author_person_id: "",
  supervisor_person_id: "",
  journal_name_optional: "",
  conference_name_optional: "",
  conference_date_optional: "",
  conference_place_optional: "",
  description_optional: "",
  collaborator_ids: [],
  deadlines: {},
};

export default function PublicationsPage() {
  const [publications, setPublications] = useState<FullPublication[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [statuses, setStatuses] = useState<PublicationStatus[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const [selectedPublication, setSelectedPublication] =
    useState<FullPublication | null>(null);
  const [form, setForm] = useState<PublicationFormState>(emptyForm);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [publicationData, peopleData, statusData] = await Promise.all([
        getFullPublications(),
        getPeople(),
        getPublicationStatuses(),
      ]);

      setPublications(publicationData);
      setPeople(peopleData);
      setStatuses(statusData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load publications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredPublications = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return publications;
    }

    return publications.filter((publication) => {
      return [
        publication.publication_code,
        publication.title,
        publication.type,
        publication.current_status_name,
        publication.main_author_name,
        publication.supervisor_name,
        publication.journal_name_optional,
        publication.conference_name_optional,
        publication.conference_place_optional,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [publications, search]);

  function toggleValue(values: string[], value: string) {
    if (values.includes(value)) {
      return values.filter((item) => item !== value);
    }

    return [...values, value];
  }

  function openCreateForm() {
    setSelectedPublication(null);
    setForm({
      ...emptyForm,
      current_status_id: statuses[0]?.id || "",
      deadlines: Object.fromEntries(statuses.map((status) => [status.id, ""])),
    });
    setFormOpen(true);
  }

  function openEditForm(publication: FullPublication) {
    setSelectedPublication(publication);

    const deadlineMap = Object.fromEntries(
      statuses.map((status) => [status.id, ""])
    );

    for (const deadline of publication.deadlines) {
      deadlineMap[deadline.publication_status_id] =
        deadline.deadline_optional || "";
    }

    setForm({
      type: publication.type,
      title: publication.title,
      current_status_id: publication.current_status_id,
      main_author_person_id: publication.main_author_person_id,
      supervisor_person_id: publication.supervisor_person_id,
      journal_name_optional: publication.journal_name_optional || "",
      conference_name_optional: publication.conference_name_optional || "",
      conference_date_optional: publication.conference_date_optional || "",
      conference_place_optional: publication.conference_place_optional || "",
      description_optional: publication.description_optional || "",
      collaborator_ids: publication.collaborators.map((person) => person.id),
      deadlines: deadlineMap,
    });

    setFormOpen(true);
  }

  function openDetail(publication: FullPublication) {
    setSelectedPublication(publication);
    setDetailOpen(true);
  }

  function openArchive(publication: FullPublication) {
    setSelectedPublication(publication);
    setArchiveOpen(true);
  }

  function makePayload(): PublicationPayload {
    return {
      type: form.type,
      title: form.title,
      current_status_id: form.current_status_id,
      main_author_person_id: form.main_author_person_id,
      supervisor_person_id: form.supervisor_person_id,
      journal_name_optional:
        form.type === "Journal" ? form.journal_name_optional || null : null,
      conference_name_optional:
        form.type === "Conference"
          ? form.conference_name_optional || null
          : null,
      conference_date_optional:
        form.type === "Conference"
          ? form.conference_date_optional || null
          : null,
      conference_place_optional:
        form.type === "Conference"
          ? form.conference_place_optional || null
          : null,
      description_optional: form.description_optional || null,
      collaborator_ids: form.collaborator_ids,
      deadlines: statuses.map((status) => ({
        publication_status_id: status.id,
        deadline_optional: form.deadlines[status.id] || null,
      })),
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      const payload = makePayload();

      if (selectedPublication) {
        await updatePublication(selectedPublication.id, payload);
      } else {
        await createPublication(payload);
      }

      setFormOpen(false);
      setSelectedPublication(null);
      setForm(emptyForm);
      await loadAll();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save publication."
      );
    }
  }

  async function handleArchive() {
    if (!selectedPublication) {
      return;
    }

    try {
      setError("");
      await archivePublication(selectedPublication.id);
      setArchiveOpen(false);
      setSelectedPublication(null);
      await loadAll();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to archive publication."
      );
    }
  }

  const currentStatusOrdering =
    statuses.find((status) => status.id === form.current_status_id)?.ordering ||
    0;

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Publications
          </h1>
          <p className="mt-2 text-gray-600">
            Manage journal and conference publications.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white hover:bg-[#C95500]"
        >
          Create publication
        </button>
      </div>

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search publications..."
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
          Loading publications...
        </div>
      ) : (
        <DataTable<FullPublication>
          data={filteredPublications}
          emptyMessage="No publications found."
          columns={[
            {
              key: "publication_code",
              header: "ID",
              render: (publication) => (
                <button
                  onClick={() => openDetail(publication)}
                  className="font-medium text-[#E16000] hover:underline"
                >
                  {publication.publication_code}
                </button>
              ),
            },
            {
              key: "title",
              header: "Title",
              render: (publication) => publication.title,
            },
            {
              key: "type",
              header: "Type",
              render: (publication) => publication.type,
            },
            {
              key: "current_status_name",
              header: "Status",
              render: (publication) => (
                <StatusBadge label={publication.current_status_name || "-"} />
              ),
            },
            {
              key: "main_author_name",
              header: "Main author",
              render: (publication) => publication.main_author_name || "-",
            },
            {
              key: "actions",
              header: "Actions",
              render: (publication) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(publication)}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => openArchive(publication)}
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
        title={selectedPublication ? "Edit publication" : "Create publication"}
        onClose={() => setFormOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              >
                <option value="Journal">Journal</option>
                <option value="Conference">Conference</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Current status
              </span>
              <select
                value={form.current_status_id}
                onChange={(event) =>
                  setForm({ ...form, current_status_id: event.target.value })
                }
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              >
                <option value="">Select status</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.ordering}. {status.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Main author
              </span>
              <select
                value={form.main_author_person_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    main_author_person_id: event.target.value,
                  })
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
                  setForm({
                    ...form,
                    supervisor_person_id: event.target.value,
                  })
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

          {form.type === "Journal" ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Journal name
              </span>
              <input
                value={form.journal_name_optional}
                onChange={(event) =>
                  setForm({
                    ...form,
                    journal_name_optional: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
              />
            </label>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Conference name
                </span>
                <input
                  value={form.conference_name_optional}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      conference_name_optional: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Conference date
                </span>
                <input
                  type="date"
                  value={form.conference_date_optional}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      conference_date_optional: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Conference place
                </span>
                <input
                  value={form.conference_place_optional}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      conference_place_optional: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
                />
              </label>
            </div>
          )}

          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">
              Collaborators
            </legend>
            <div className="grid gap-2 md:grid-cols-2">
              {people.map((person) => (
                <label
                  key={person.id}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={form.collaborator_ids.includes(person.id)}
                    onChange={() =>
                      setForm({
                        ...form,
                        collaborator_ids: toggleValue(
                          form.collaborator_ids,
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

          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">
              Publication deadlines
            </legend>

            <div className="space-y-3">
              {statuses.map((status) => {
                const inactive = status.ordering < currentStatusOrdering;

                return (
                  <label
                    key={status.id}
                    className={`grid gap-2 text-sm md:grid-cols-[1fr_180px] md:items-center ${
                      inactive ? "text-gray-400" : "text-gray-700"
                    }`}
                  >
                    <span>
                      {status.ordering}. {status.name}
                      {inactive ? " (past status)" : ""}
                    </span>

                    <input
                      type="date"
                      disabled={inactive}
                      value={form.deadlines[status.id] || ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          deadlines: {
                            ...form.deadlines,
                            [status.id]: event.target.value,
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
              value={form.description_optional}
              onChange={(event) =>
                setForm({
                  ...form,
                  description_optional: event.target.value,
                })
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
        title="Publication detail"
        onClose={() => setDetailOpen(false)}
      >
        {selectedPublication && (
          <div className="space-y-5 text-sm text-gray-700">
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">ID</p>
              <p className="mt-1 font-semibold text-[#E16000]">
                {selectedPublication.publication_code}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Title
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {selectedPublication.title}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Type
                </p>
                <p>{selectedPublication.type}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Status
                </p>
                <StatusBadge
                  label={selectedPublication.current_status_name || "-"}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Main author
                </p>
                <p>{selectedPublication.main_author_name || "-"}</p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-gray-400">
                  Supervisor
                </p>
                <p>{selectedPublication.supervisor_name || "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Venue
              </p>
              <p>
                {selectedPublication.type === "Journal"
                  ? selectedPublication.journal_name_optional || "-"
                  : [
                      selectedPublication.conference_name_optional,
                      selectedPublication.conference_date_optional,
                      selectedPublication.conference_place_optional,
                    ]
                      .filter(Boolean)
                      .join(" — ") || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Collaborators
              </p>
              <p>
                {selectedPublication.collaborators.length
                  ? selectedPublication.collaborators
                      .map((person) => person.full_name)
                      .join(", ")
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Linked activities
              </p>
              <p>
                {selectedPublication.activities.length
                  ? selectedPublication.activities
                      .map(
                        (activity) =>
                          `${activity.activity_code} ${activity.title}`
                      )
                      .join(", ")
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-gray-400">
                Deadlines
              </p>
              <div className="mt-2 space-y-1">
                {selectedPublication.deadlines.length ? (
                  selectedPublication.deadlines.map((deadline) => (
                    <div
                      key={deadline.id || deadline.publication_status_id}
                      className="flex justify-between border-b border-gray-100 py-1"
                    >
                      <span>{deadline.status_name}</span>
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
                Description
              </p>
              <p className="whitespace-pre-wrap">
                {selectedPublication.description_optional || "-"}
              </p>
            </div>
          </div>
        )}
      </FormModal>

      <ConfirmDialog
        open={archiveOpen}
        title="Archive publication"
        message={`Archive "${selectedPublication?.title}"? It will disappear from the normal publication list.`}
        confirmLabel="Archive"
        onCancel={() => setArchiveOpen(false)}
        onConfirm={handleArchive}
      />
    </div>
  );
}