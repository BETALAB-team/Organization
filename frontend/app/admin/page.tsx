"use client";

import { useEffect, useState } from "react";

import ConfirmDialog from "@/components/ConfirmDialog";
import DataTable from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import StatusBadge from "@/components/StatusBadge";
import {
  ActivityStage,
  createActivityStage,
  createMeetingPurpose,
  createPerson,
  createPublicationStatus,
  createResearchField,
  createRole,
  deleteActivityStage,
  deleteMeetingPurpose,
  deactivatePerson,
  deletePublicationStatus,
  deleteResearchField,
  deleteRole,
  getActivityStages,
  getMeetingPurposes,
  getPeople,
  getPublicationStatuses,
  getResearchFields,
  getRoles,
  MeetingPurpose,
  Person,
  PublicationStatus,
  ResearchField,
  Role,
  updateActivityStage,
  updateMeetingPurpose,
  updatePerson,
  updatePublicationStatus,
  updateResearchField,
  updateRole,
} from "@/lib/api";

type ModalType =
  | "role"
  | "person"
  | "field"
  | "activityStage"
  | "publicationStatus"
  | "meetingPurpose"
  | null;

type DeleteTarget = {
  type:
    | "role"
    | "person"
    | "field"
    | "activityStage"
    | "publicationStatus"
    | "meetingPurpose";
  id: string;
  label: string;
};

export default function AdminPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [fields, setFields] = useState<ResearchField[]>([]);
  const [activityStages, setActivityStages] = useState<ActivityStage[]>([]);
  const [publicationStatuses, setPublicationStatuses] = useState<
    PublicationStatus[]
  >([]);
  const [meetingPurposes, setMeetingPurposes] = useState<MeetingPurpose[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
  });

  const [personForm, setPersonForm] = useState({
    full_name: "",
    role_id: "",
    email_optional: "",
  });

  const [fieldForm, setFieldForm] = useState({
    name: "",
    prefix: "",
    description_optional: "",
  });

  const [activityStageForm, setActivityStageForm] = useState({
    name: "",
    ordering: "",
    description_optional: "",
  });

  const [publicationStatusForm, setPublicationStatusForm] = useState({
    name: "",
    ordering: "",
    workflow_group: "before_submission",
  });

  const [meetingPurposeForm, setMeetingPurposeForm] = useState({
    name: "",
    description_optional: "",
  });

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [
        roleData,
        peopleData,
        fieldData,
        activityStageData,
        publicationStatusData,
        meetingPurposeData,
      ] = await Promise.all([
        getRoles(),
        getPeople(),
        getResearchFields(),
        getActivityStages(),
        getPublicationStatuses(),
        getMeetingPurposes(),
      ]);

      setRoles(roleData);
      setPeople(peopleData);
      setFields(fieldData);
      setActivityStages(activityStageData);
      setPublicationStatuses(publicationStatusData);
      setMeetingPurposes(meetingPurposeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function closeModal() {
    setModalType(null);
    setEditingId(null);
  }

  function openCreateRole() {
    setEditingId(null);
    setRoleForm({ name: "", description: "" });
    setModalType("role");
  }

  function openCreatePerson() {
    setEditingId(null);
    setPersonForm({
      full_name: "",
      role_id: "",
      email_optional: "",
    });
    setModalType("person");
  }

  function openCreateField() {
    setEditingId(null);
    setFieldForm({
      name: "",
      prefix: "",
      description_optional: "",
    });
    setModalType("field");
  }

  function openCreateActivityStage() {
    setEditingId(null);
    setActivityStageForm({
      name: "",
      ordering: "",
      description_optional: "",
    });
    setModalType("activityStage");
  }

  function openCreatePublicationStatus() {
    setEditingId(null);
    setPublicationStatusForm({
      name: "",
      ordering: "",
      workflow_group: "before_submission",
    });
    setModalType("publicationStatus");
  }

  function openCreateMeetingPurpose() {
    setEditingId(null);
    setMeetingPurposeForm({
      name: "",
      description_optional: "",
    });
    setModalType("meetingPurpose");
  }

  function editRole(role: Role) {
    setEditingId(role.id);
    setRoleForm({
      name: role.name,
      description: role.description || "",
    });
    setModalType("role");
  }

  function editPerson(person: Person) {
    setEditingId(person.id);
    setPersonForm({
      full_name: person.full_name,
      role_id: person.role_id,
      email_optional: person.email_optional || "",
    });
    setModalType("person");
  }

  function editField(field: ResearchField) {
    setEditingId(field.id);
    setFieldForm({
      name: field.name,
      prefix: field.prefix,
      description_optional: field.description_optional || "",
    });
    setModalType("field");
  }

  function editActivityStage(stage: ActivityStage) {
    setEditingId(stage.id);
    setActivityStageForm({
      name: stage.name,
      ordering: String(stage.ordering),
      description_optional: stage.description_optional || "",
    });
    setModalType("activityStage");
  }

  function editPublicationStatus(status: PublicationStatus) {
    setEditingId(status.id);
    setPublicationStatusForm({
      name: status.name,
      ordering: String(status.ordering),
      workflow_group: status.workflow_group,
    });
    setModalType("publicationStatus");
  }

  function editMeetingPurpose(purpose: MeetingPurpose) {
    setEditingId(purpose.id);
    setMeetingPurposeForm({
      name: purpose.name,
      description_optional: purpose.description_optional || "",
    });
    setModalType("meetingPurpose");
  }

  async function handleSaveRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        name: roleForm.name,
        description: roleForm.description || null,
      };

      if (editingId) {
        await updateRole(editingId, payload);
      } else {
        await createRole(payload);
      }

      closeModal();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save role.");
    }
  }

  async function handleSavePerson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        full_name: personForm.full_name,
        role_id: personForm.role_id,
        email_optional: personForm.email_optional || null,
      };

      if (editingId) {
        await updatePerson(editingId, payload);
      } else {
        await createPerson(payload);
      }

      closeModal();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save person.");
    }
  }

  async function handleSaveField(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        name: fieldForm.name,
        prefix: fieldForm.prefix,
        description_optional: fieldForm.description_optional || null,
      };

      if (editingId) {
        await updateResearchField(editingId, payload);
      } else {
        await createResearchField(payload);
      }

      closeModal();
      await loadAll();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save research field."
      );
    }
  }

  async function handleSaveActivityStage(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        name: activityStageForm.name,
        ordering: Number(activityStageForm.ordering),
        description_optional: activityStageForm.description_optional || null,
      };

      if (editingId) {
        await updateActivityStage(editingId, payload);
      } else {
        await createActivityStage(payload);
      }

      closeModal();
      await loadAll();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save activity stage."
      );
    }
  }

  async function handleSavePublicationStatus(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        name: publicationStatusForm.name,
        ordering: Number(publicationStatusForm.ordering),
        workflow_group: publicationStatusForm.workflow_group,
      };

      if (editingId) {
        await updatePublicationStatus(editingId, payload);
      } else {
        await createPublicationStatus(payload);
      }

      closeModal();
      await loadAll();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save publication status."
      );
    }
  }

  async function handleSaveMeetingPurpose(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setError("");

      const payload = {
        name: meetingPurposeForm.name,
        description_optional: meetingPurposeForm.description_optional || null,
      };

      if (editingId) {
        await updateMeetingPurpose(editingId, payload);
      } else {
        await createMeetingPurpose(payload);
      }

      closeModal();
      await loadAll();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save meeting purpose."
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      setError("");

      if (deleteTarget.type === "role") {
        await deleteRole(deleteTarget.id);
      }

      if (deleteTarget.type === "person") {
        await deactivatePerson(deleteTarget.id);
      }

      if (deleteTarget.type === "field") {
        await deleteResearchField(deleteTarget.id);
      }

      if (deleteTarget.type === "activityStage") {
        await deleteActivityStage(deleteTarget.id);
      }

      if (deleteTarget.type === "publicationStatus") {
        await deletePublicationStatus(deleteTarget.id);
      }

      if (deleteTarget.type === "meetingPurpose") {
        await deleteMeetingPurpose(deleteTarget.id);
      }

      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item.");
      setDeleteTarget(null);
    }
  }

  const roleNameById = new Map(roles.map((role) => [role.id, role.name]));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
        <p className="mt-2 text-gray-600">
          Manage people, roles, fields, prefixes, stages, statuses, and meeting
          purposes.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
          Loading admin data...
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
              <button
                onClick={openCreateRole}
                className="rounded-lg bg-[#E16000] px-3 py-2 text-xs font-medium text-white"
              >
                Add role
              </button>
            </div>

            <DataTable<Role>
              data={roles}
              emptyMessage="No roles yet."
              columns={[
                { key: "name", header: "Name" },
                {
                  key: "description",
                  header: "Description",
                  render: (role) => role.description || "-",
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (role) => (
                    <AdminActions
                      onEdit={() => editRole(role)}
                      onDelete={() =>
                        setDeleteTarget({
                          type: "role",
                          id: role.id,
                          label: role.name,
                        })
                      }
                    />
                  ),
                },
              ]}
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">People</h2>
              <button
                onClick={openCreatePerson}
                className="rounded-lg bg-[#E16000] px-3 py-2 text-xs font-medium text-white"
              >
                Add person
              </button>
            </div>

            <DataTable<Person>
              data={people}
              emptyMessage="No people yet."
              columns={[
                { key: "full_name", header: "Name" },
                {
                  key: "role_id",
                  header: "Role",
                  render: (person) => roleNameById.get(person.role_id) || "-",
                },
                {
                  key: "email_optional",
                  header: "Email",
                  render: (person) => person.email_optional || "-",
                },
                {
                  key: "is_active",
                  header: "Status",
                  render: (person) => (
                    <StatusBadge
                      label={person.is_active ? "Active" : "Inactive"}
                    />
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (person) => (
                    <AdminActions
                      onEdit={() => editPerson(person)}
                      onDelete={() =>
                        setDeleteTarget({
                          type: "person",
                          id: person.id,
                          label: person.full_name,
                        })
                      }
                    />
                  ),
                },
              ]}
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Research Fields
              </h2>
              <button
                onClick={openCreateField}
                className="rounded-lg bg-[#E16000] px-3 py-2 text-xs font-medium text-white"
              >
                Add field
              </button>
            </div>

            <DataTable<ResearchField>
              data={fields}
              emptyMessage="No research fields yet."
              columns={[
                { key: "name", header: "Name" },
                { key: "prefix", header: "Prefix" },
                {
                  key: "description_optional",
                  header: "Description",
                  render: (field) => field.description_optional || "-",
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (field) => (
                    <AdminActions
                      onEdit={() => editField(field)}
                      onDelete={() =>
                        setDeleteTarget({
                          type: "field",
                          id: field.id,
                          label: field.name,
                        })
                      }
                    />
                  ),
                },
              ]}
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Activity Stages
              </h2>
              <button
                onClick={openCreateActivityStage}
                className="rounded-lg bg-[#E16000] px-3 py-2 text-xs font-medium text-white"
              >
                Add stage
              </button>
            </div>

            <DataTable<ActivityStage>
              data={activityStages}
              emptyMessage="No activity stages yet."
              columns={[
                { key: "ordering", header: "Order" },
                { key: "name", header: "Name" },
                {
                  key: "description_optional",
                  header: "Description",
                  render: (stage) => stage.description_optional || "-",
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (stage) => (
                    <AdminActions
                      onEdit={() => editActivityStage(stage)}
                      onDelete={() =>
                        setDeleteTarget({
                          type: "activityStage",
                          id: stage.id,
                          label: stage.name,
                        })
                      }
                    />
                  ),
                },
              ]}
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Publication Statuses
              </h2>
              <button
                onClick={openCreatePublicationStatus}
                className="rounded-lg bg-[#E16000] px-3 py-2 text-xs font-medium text-white"
              >
                Add status
              </button>
            </div>

            <DataTable<PublicationStatus>
              data={publicationStatuses}
              emptyMessage="No publication statuses yet."
              columns={[
                { key: "ordering", header: "Order" },
                { key: "name", header: "Name" },
                {
                  key: "workflow_group",
                  header: "Group",
                  render: (status) => (
                    <StatusBadge label={status.workflow_group} />
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (status) => (
                    <AdminActions
                      onEdit={() => editPublicationStatus(status)}
                      onDelete={() =>
                        setDeleteTarget({
                          type: "publicationStatus",
                          id: status.id,
                          label: status.name,
                        })
                      }
                    />
                  ),
                },
              ]}
            />
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Meeting Purposes
              </h2>
              <button
                onClick={openCreateMeetingPurpose}
                className="rounded-lg bg-[#E16000] px-3 py-2 text-xs font-medium text-white"
              >
                Add purpose
              </button>
            </div>

            <DataTable<MeetingPurpose>
              data={meetingPurposes}
              emptyMessage="No meeting purposes yet."
              columns={[
                { key: "name", header: "Name" },
                {
                  key: "description_optional",
                  header: "Description",
                  render: (purpose) => purpose.description_optional || "-",
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (purpose) => (
                    <AdminActions
                      onEdit={() => editMeetingPurpose(purpose)}
                      onDelete={() =>
                        setDeleteTarget({
                          type: "meetingPurpose",
                          id: purpose.id,
                          label: purpose.name,
                        })
                      }
                    />
                  ),
                },
              ]}
            />
          </section>
        </div>
      )}

      <FormModal
        open={modalType === "role"}
        title={editingId ? "Edit role" : "Add role"}
        onClose={closeModal}
      >
        <form onSubmit={handleSaveRole} className="space-y-4">
          <input
            value={roleForm.name}
            onChange={(event) =>
              setRoleForm({ ...roleForm, name: event.target.value })
            }
            required
            placeholder="Role name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <textarea
            value={roleForm.description}
            onChange={(event) =>
              setRoleForm({ ...roleForm, description: event.target.value })
            }
            placeholder="Description"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <ModalButtons
            onCancel={closeModal}
            submitLabel={editingId ? "Save changes" : "Create role"}
          />
        </form>
      </FormModal>

      <FormModal
        open={modalType === "person"}
        title={editingId ? "Edit person" : "Add person"}
        onClose={closeModal}
      >
        <form onSubmit={handleSavePerson} className="space-y-4">
          <input
            value={personForm.full_name}
            onChange={(event) =>
              setPersonForm({ ...personForm, full_name: event.target.value })
            }
            required
            placeholder="Full name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <select
            value={personForm.role_id}
            onChange={(event) =>
              setPersonForm({ ...personForm, role_id: event.target.value })
            }
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <input
            value={personForm.email_optional}
            onChange={(event) =>
              setPersonForm({
                ...personForm,
                email_optional: event.target.value,
              })
            }
            placeholder="Email optional"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <ModalButtons
            onCancel={closeModal}
            submitLabel={editingId ? "Save changes" : "Create person"}
          />
        </form>
      </FormModal>

      <FormModal
        open={modalType === "field"}
        title={editingId ? "Edit research field" : "Add research field"}
        onClose={closeModal}
      >
        <form onSubmit={handleSaveField} className="space-y-4">
          <input
            value={fieldForm.name}
            onChange={(event) =>
              setFieldForm({ ...fieldForm, name: event.target.value })
            }
            required
            placeholder="Field name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <input
            value={fieldForm.prefix}
            onChange={(event) =>
              setFieldForm({
                ...fieldForm,
                prefix: event.target.value.toUpperCase(),
              })
            }
            required
            placeholder="Prefix, e.g. HP"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase outline-none focus:border-[#E16000]"
          />

          <textarea
            value={fieldForm.description_optional}
            onChange={(event) =>
              setFieldForm({
                ...fieldForm,
                description_optional: event.target.value,
              })
            }
            placeholder="Description"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <ModalButtons
            onCancel={closeModal}
            submitLabel={editingId ? "Save changes" : "Create field"}
          />
        </form>
      </FormModal>

      <FormModal
        open={modalType === "activityStage"}
        title={editingId ? "Edit activity stage" : "Add activity stage"}
        onClose={closeModal}
      >
        <form onSubmit={handleSaveActivityStage} className="space-y-4">
          <input
            value={activityStageForm.name}
            onChange={(event) =>
              setActivityStageForm({
                ...activityStageForm,
                name: event.target.value,
              })
            }
            required
            placeholder="Stage name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <input
            type="number"
            value={activityStageForm.ordering}
            onChange={(event) =>
              setActivityStageForm({
                ...activityStageForm,
                ordering: event.target.value,
              })
            }
            required
            placeholder="Ordering"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <textarea
            value={activityStageForm.description_optional}
            onChange={(event) =>
              setActivityStageForm({
                ...activityStageForm,
                description_optional: event.target.value,
              })
            }
            placeholder="Description"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <ModalButtons
            onCancel={closeModal}
            submitLabel={editingId ? "Save changes" : "Create stage"}
          />
        </form>
      </FormModal>

      <FormModal
        open={modalType === "publicationStatus"}
        title={editingId ? "Edit publication status" : "Add publication status"}
        onClose={closeModal}
      >
        <form onSubmit={handleSavePublicationStatus} className="space-y-4">
          <input
            value={publicationStatusForm.name}
            onChange={(event) =>
              setPublicationStatusForm({
                ...publicationStatusForm,
                name: event.target.value,
              })
            }
            required
            placeholder="Status name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <input
            type="number"
            value={publicationStatusForm.ordering}
            onChange={(event) =>
              setPublicationStatusForm({
                ...publicationStatusForm,
                ordering: event.target.value,
              })
            }
            required
            placeholder="Ordering"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <select
            value={publicationStatusForm.workflow_group}
            onChange={(event) =>
              setPublicationStatusForm({
                ...publicationStatusForm,
                workflow_group: event.target.value,
              })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          >
            <option value="before_submission">Before submission</option>
            <option value="after_submission">After submission</option>
          </select>

          <ModalButtons
            onCancel={closeModal}
            submitLabel={editingId ? "Save changes" : "Create status"}
          />
        </form>
      </FormModal>

      <FormModal
        open={modalType === "meetingPurpose"}
        title={editingId ? "Edit meeting purpose" : "Add meeting purpose"}
        onClose={closeModal}
      >
        <form onSubmit={handleSaveMeetingPurpose} className="space-y-4">
          <input
            value={meetingPurposeForm.name}
            onChange={(event) =>
              setMeetingPurposeForm({
                ...meetingPurposeForm,
                name: event.target.value,
              })
            }
            required
            placeholder="Purpose name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <textarea
            value={meetingPurposeForm.description_optional}
            onChange={(event) =>
              setMeetingPurposeForm({
                ...meetingPurposeForm,
                description_optional: event.target.value,
              })
            }
            placeholder="Description"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <ModalButtons
            onCancel={closeModal}
            submitLabel={editingId ? "Save changes" : "Create purpose"}
          />
        </form>
      </FormModal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete item"
        message={`Delete "${deleteTarget?.label}"? This only works if it is not used anywhere.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function AdminActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onEdit}
        className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
      >
        Edit
      </button>

      <button
        onClick={onDelete}
        className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}

function ModalButtons({
  onCancel,
  submitLabel,
}: {
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Cancel
      </button>

      <button
        type="submit"
        className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white hover:bg-[#C95500]"
      >
        {submitLabel}
      </button>
    </div>
  );
}