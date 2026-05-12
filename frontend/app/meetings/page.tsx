"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import {
  Activity,
  createMeeting,
  createMeetingSlot,
  confirmMeetingSlot,
  getActivities,
  getMeetingPurposes,
  getMeetings,
  getMeetingTypes,
  getPeople,
  Meeting,
  MeetingPurpose,
  MeetingType,
  Person,
  releaseMeetingSlot,
  takeMeetingSlot,
} from "@/lib/api";

type MeetingFormState = {
  title: string;
  meeting_type_id: string;
  organizer_person_id: string;
  meeting_date: string;
  start_time: string;
  end_time_optional: string;
  description_optional: string;
};

type SlotFormState = {
  meeting_id: string;
  start_time: string;
  end_time: string;
};

type TakeSlotFormState = {
  slot_id: string;
  taken_by_person_id: string;
  activity_id: string;
  purpose_id: string;
  presenter_ids: string[];
  description_optional: string;
};

const emptyMeetingForm: MeetingFormState = {
  title: "",
  meeting_type_id: "",
  organizer_person_id: "",
  meeting_date: "",
  start_time: "",
  end_time_optional: "",
  description_optional: "",
};

const emptySlotForm: SlotFormState = {
  meeting_id: "",
  start_time: "",
  end_time: "",
};

const emptyTakeSlotForm: TakeSlotFormState = {
  slot_id: "",
  taken_by_person_id: "",
  activity_id: "",
  purpose_id: "",
  presenter_ids: [],
  description_optional: "",
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [purposes, setPurposes] = useState<MeetingPurpose[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [slotFormOpen, setSlotFormOpen] = useState(false);
  const [takeSlotFormOpen, setTakeSlotFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [meetingForm, setMeetingForm] = useState<MeetingFormState>(emptyMeetingForm);
  const [slotForm, setSlotForm] = useState<SlotFormState>(emptySlotForm);
  const [takeSlotForm, setTakeSlotForm] = useState<TakeSlotFormState>(emptyTakeSlotForm);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [meetingData, peopleData, activityData, typeData, purposeData] =
        await Promise.all([
          getMeetings(),
          getPeople(),
          getActivities(),
          getMeetingTypes(),
          getMeetingPurposes(),
        ]);

      setMeetings(meetingData);
      setPeople(peopleData);
      setActivities(activityData);
      setMeetingTypes(typeData);
      setPurposes(purposeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filteredMeetings = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return meetings;
    }

    return meetings.filter((meeting) =>
      [
        meeting.title,
        meeting.meeting_type_name,
        meeting.organizer_name,
        meeting.meeting_date,
        meeting.description_optional,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [meetings, search]);

  function toggleValue(values: string[], value: string) {
    if (values.includes(value)) {
      return values.filter((item) => item !== value);
    }

    return [...values, value];
  }

  function openCreateMeeting() {
    setMeetingForm({
      ...emptyMeetingForm,
      meeting_type_id: meetingTypes[0]?.id || "",
      organizer_person_id: people[0]?.id || "",
    });
    setMeetingFormOpen(true);
  }

  function openCreateSlot(meeting: Meeting) {
    setSlotForm({
      meeting_id: meeting.id,
      start_time: "",
      end_time: "",
    });
    setSlotFormOpen(true);
  }

  function openTakeSlot(slotId: string) {
    setTakeSlotForm({
      ...emptyTakeSlotForm,
      slot_id: slotId,
      taken_by_person_id: people[0]?.id || "",
      activity_id: activities[0]?.id || "",
      purpose_id: purposes[0]?.id || "",
    });
    setTakeSlotFormOpen(true);
  }

  async function handleCreateMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      await createMeeting({
        title: meetingForm.title,
        meeting_type_id: meetingForm.meeting_type_id,
        organizer_person_id: meetingForm.organizer_person_id,
        meeting_date: meetingForm.meeting_date,
        start_time: meetingForm.start_time,
        end_time_optional: meetingForm.end_time_optional || null,
        description_optional: meetingForm.description_optional || null,
      });

      setMeetingFormOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create meeting.");
    }
  }

  async function handleCreateSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      await createMeetingSlot({
        meeting_id: slotForm.meeting_id,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
      });

      setSlotFormOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create slot.");
    }
  }

  async function handleTakeSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");

      await takeMeetingSlot(takeSlotForm.slot_id, {
        taken_by_person_id: takeSlotForm.taken_by_person_id,
        activity_id: takeSlotForm.activity_id,
        purpose_id: takeSlotForm.purpose_id || null,
        presenter_ids: takeSlotForm.presenter_ids.length
          ? takeSlotForm.presenter_ids
          : [takeSlotForm.taken_by_person_id],
        description_optional: takeSlotForm.description_optional || null,
      });

      setTakeSlotFormOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to take slot.");
    }
  }

  async function handleReleaseSlot(slotId: string) {
    try {
      setError("");
      await releaseMeetingSlot(slotId);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to release slot.");
    }
  }

  async function handleConfirmSlot(slotId: string) {
    try {
      setError("");
      await confirmMeetingSlot(slotId);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm slot.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Meetings</h1>
          <p className="mt-2 text-gray-600">
            Create meetings, open slots, take slots, and confirm presented activities.
          </p>
        </div>

        <button
          onClick={openCreateMeeting}
          className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white hover:bg-[#C95500]"
        >
          Create meeting
        </button>
      </div>

      <div className="mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search meetings..." />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
          Loading meetings...
        </div>
      ) : (
        <DataTable<Meeting>
          data={filteredMeetings}
          emptyMessage="No meetings found."
          columns={[
            {
              key: "title",
              header: "Title",
              render: (meeting) => (
                <button
                  onClick={() => {
                    setSelectedMeeting(meeting);
                    setDetailOpen(true);
                  }}
                  className="font-medium text-[#E16000] hover:underline"
                >
                  {meeting.title}
                </button>
              ),
            },
            {
              key: "meeting_type_name",
              header: "Type",
              render: (meeting) => meeting.meeting_type_name || "-",
            },
            {
              key: "meeting_date",
              header: "Date",
              render: (meeting) => meeting.meeting_date,
            },
            {
              key: "start_time",
              header: "Time",
              render: (meeting) =>
                `${meeting.start_time}${meeting.end_time_optional ? `-${meeting.end_time_optional}` : ""}`,
            },
            {
              key: "organizer_name",
              header: "Organizer",
              render: (meeting) => meeting.organizer_name || "-",
            },
            {
              key: "slots",
              header: "Slots",
              render: (meeting) => `${meeting.slots.length}`,
            },
            {
              key: "actions",
              header: "Actions",
              render: (meeting) => (
                <button
                  onClick={() => openCreateSlot(meeting)}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Add slot
                </button>
              ),
            },
          ]}
        />
      )}

      <FormModal
        open={meetingFormOpen}
        title="Create meeting"
        onClose={() => setMeetingFormOpen(false)}
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <input
            value={meetingForm.title}
            onChange={(event) => setMeetingForm({ ...meetingForm, title: event.target.value })}
            required
            placeholder="Meeting title"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={meetingForm.meeting_type_id}
              onChange={(event) =>
                setMeetingForm({ ...meetingForm, meeting_type_id: event.target.value })
              }
              required
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            >
              <option value="">Select meeting type</option>
              {meetingTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>

            <select
              value={meetingForm.organizer_person_id}
              onChange={(event) =>
                setMeetingForm({ ...meetingForm, organizer_person_id: event.target.value })
              }
              required
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            >
              <option value="">Select organizer</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="date"
              value={meetingForm.meeting_date}
              onChange={(event) =>
                setMeetingForm({ ...meetingForm, meeting_date: event.target.value })
              }
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />

            <input
              type="time"
              value={meetingForm.start_time}
              onChange={(event) =>
                setMeetingForm({ ...meetingForm, start_time: event.target.value })
              }
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />

            <input
              type="time"
              value={meetingForm.end_time_optional}
              onChange={(event) =>
                setMeetingForm({ ...meetingForm, end_time_optional: event.target.value })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </div>

          <textarea
            value={meetingForm.description_optional}
            onChange={(event) =>
              setMeetingForm({ ...meetingForm, description_optional: event.target.value })
            }
            rows={4}
            placeholder="Description"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setMeetingFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white">
              Save
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal open={slotFormOpen} title="Create slot" onClose={() => setSlotFormOpen(false)}>
        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="time"
              value={slotForm.start_time}
              onChange={(event) => setSlotForm({ ...slotForm, start_time: event.target.value })}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />

            <input
              type="time"
              value={slotForm.end_time}
              onChange={(event) => setSlotForm({ ...slotForm, end_time: event.target.value })}
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setSlotFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white">
              Save slot
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal open={takeSlotFormOpen} title="Take slot" onClose={() => setTakeSlotFormOpen(false)}>
        <form onSubmit={handleTakeSlot} className="space-y-4">
          <select
            value={takeSlotForm.taken_by_person_id}
            onChange={(event) =>
              setTakeSlotForm({ ...takeSlotForm, taken_by_person_id: event.target.value })
            }
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          >
            <option value="">Select person taking the slot</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name}
              </option>
            ))}
          </select>

          <select
            value={takeSlotForm.activity_id}
            onChange={(event) => setTakeSlotForm({ ...takeSlotForm, activity_id: event.target.value })}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          >
            <option value="">Select activity</option>
            {activities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.activity_code} — {activity.title}
              </option>
            ))}
          </select>

          <select
            value={takeSlotForm.purpose_id}
            onChange={(event) => setTakeSlotForm({ ...takeSlotForm, purpose_id: event.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          >
            <option value="">Select purpose</option>
            {purposes.map((purpose) => (
              <option key={purpose.id} value={purpose.id}>
                {purpose.name}
              </option>
            ))}
          </select>

          <fieldset className="rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-medium text-gray-700">Presenters</legend>
            <div className="grid gap-2 md:grid-cols-2">
              {people.map((person) => (
                <label key={person.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={takeSlotForm.presenter_ids.includes(person.id)}
                    onChange={() =>
                      setTakeSlotForm({
                        ...takeSlotForm,
                        presenter_ids: toggleValue(takeSlotForm.presenter_ids, person.id),
                      })
                    }
                  />
                  {person.full_name}
                </label>
              ))}
            </div>
          </fieldset>

          <textarea
            value={takeSlotForm.description_optional}
            onChange={(event) =>
              setTakeSlotForm({ ...takeSlotForm, description_optional: event.target.value })
            }
            rows={4}
            placeholder="Description"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#E16000]"
          />

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setTakeSlotFormOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-[#E16000] px-4 py-2 text-sm font-medium text-white">
              Take slot
            </button>
          </div>
        </form>
      </FormModal>

      <FormModal open={detailOpen} title="Meeting detail" onClose={() => setDetailOpen(false)}>
        {selectedMeeting && (
          <div className="space-y-5 text-sm text-gray-700">
            <div>
              <p className="text-lg font-semibold text-gray-900">{selectedMeeting.title}</p>
              <p className="text-gray-500">
                {selectedMeeting.meeting_type_name} — {selectedMeeting.meeting_date} — {selectedMeeting.start_time}
              </p>
            </div>

            <div className="space-y-3">
              {selectedMeeting.slots.length === 0 ? (
                <p className="text-gray-500">No slots yet.</p>
              ) : (
                selectedMeeting.slots.map((slot) => (
                  <div key={slot.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          {slot.start_time} - {slot.end_time}
                        </p>
                        <div className="mt-1">
                          <StatusBadge label={slot.status} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {slot.status === "Open" && (
                          <button
                            onClick={() => openTakeSlot(slot.id)}
                            className="rounded-lg bg-[#E16000] px-3 py-1 text-xs font-medium text-white"
                          >
                            Take slot
                          </button>
                        )}

                        {slot.status === "Taken" && (
                          <>
                            <button
                              onClick={() => handleReleaseSlot(slot.id)}
                              className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700"
                            >
                              Release
                            </button>

                            <button
                              onClick={() => handleConfirmSlot(slot.id)}
                              className="rounded-lg bg-green-700 px-3 py-1 text-xs font-medium text-white"
                            >
                              Confirm presented
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {slot.activity_title && (
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase text-gray-400">Activity</p>
                        <p>
                          {slot.activity_code} — {slot.activity_title}
                        </p>
                      </div>
                    )}

                    {slot.taken_by_name && (
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase text-gray-400">Taken by</p>
                        <p>{slot.taken_by_name}</p>
                      </div>
                    )}

                    {slot.presenters.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase text-gray-400">Presenters</p>
                        <p>{slot.presenters.map((person) => person.full_name).join(", ")}</p>
                      </div>
                    )}

                    {slot.purpose_name && (
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase text-gray-400">Purpose</p>
                        <p>{slot.purpose_name}</p>
                      </div>
                    )}

                    {slot.description_optional && (
                      <div className="mt-3">
                        <p className="text-xs font-medium uppercase text-gray-400">Description</p>
                        <p className="whitespace-pre-wrap">{slot.description_optional}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </FormModal>
    </div>
  );
}