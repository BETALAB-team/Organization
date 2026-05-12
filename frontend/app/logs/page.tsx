"use client";

import { useEffect, useMemo, useState } from "react";

import DataTable from "@/components/DataTable";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import { getLogs, getPeople, LogEntry, Person } from "@/lib/api";

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [logData, peopleData] = await Promise.all([getLogs(), getPeople()]);

      setLogs(logData);
      setPeople(peopleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const personNameById = useMemo(() => {
    return new Map(people.map((person) => [person.id, person.full_name]));
  }, [people]);

  const entityTypes = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.entity_type))).sort();
  }, [logs]);

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action))).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase().trim();

    return logs.filter((log) => {
      const actorName = log.actor_person_id
        ? personNameById.get(log.actor_person_id) || ""
        : "";

      const matchesSearch = query
        ? [
            log.action,
            log.entity_type,
            log.entity_id,
            log.summary,
            actorName,
            log.timestamp,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        : true;

      const matchesPerson = personFilter
        ? log.actor_person_id === personFilter
        : true;

      const matchesEntity = entityFilter
        ? log.entity_type === entityFilter
        : true;

      const matchesAction = actionFilter ? log.action === actionFilter : true;

      return matchesSearch && matchesPerson && matchesEntity && matchesAction;
    });
  }, [logs, search, personFilter, entityFilter, actionFilter, personNameById]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Logs</h1>
        <p className="mt-2 text-gray-600">
          Review recent system actions and edit history.
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search logs..."
          />
        </div>

        <select
          value={personFilter}
          onChange={(event) => setPersonFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
        >
          <option value="">All people</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name}
            </option>
          ))}
        </select>

        <select
          value={entityFilter}
          onChange={(event) => setEntityFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
        >
          <option value="">All entities</option>
          {entityTypes.map((entityType) => (
            <option key={entityType} value={entityType}>
              {entityType}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#E16000]"
        >
          <option value="">All actions</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
          Loading logs...
        </div>
      ) : (
        <DataTable<LogEntry>
          data={filteredLogs}
          emptyMessage="No logs found."
          columns={[
            {
              key: "timestamp",
              header: "Time",
              render: (log) => new Date(log.timestamp).toLocaleString(),
            },
            {
              key: "actor_person_id",
              header: "Person",
              render: (log) =>
                log.actor_person_id
                  ? personNameById.get(log.actor_person_id) || "-"
                  : "-",
            },
            {
              key: "action",
              header: "Action",
              render: (log) => <StatusBadge label={log.action} />,
            },
            {
              key: "entity_type",
              header: "Entity",
              render: (log) => log.entity_type,
            },
            {
              key: "summary",
              header: "Summary",
              render: (log) => log.summary || "-",
            },
          ]}
        />
      )}
    </div>
  );
}