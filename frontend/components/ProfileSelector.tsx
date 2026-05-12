"use client";

import { useEffect, useMemo, useState } from "react";

import { getPeople, getRoles, Person, Role } from "@/lib/api";

export default function ProfileSelector() {
  const [people, setPeople] = useState<Person[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const storedPersonId = localStorage.getItem("selectedPersonId");

    if (storedPersonId) {
      setSelectedPersonId(storedPersonId);
    }

    async function loadProfiles() {
      try {
        const [peopleData, roleData] = await Promise.all([
          getPeople(),
          getRoles(),
        ]);

        setPeople(peopleData);
        setRoles(roleData);
      } catch {
        setError("Profiles unavailable");
      }
    }

    loadProfiles();
  }, []);

  const roleNameById = useMemo(() => {
    return new Map(roles.map((role) => [role.id, role.name]));
  }, [roles]);

  const selectedPerson = people.find((person) => person.id === selectedPersonId);

  function handleProfileChange(personId: string) {
    setSelectedPersonId(personId);
    localStorage.setItem("selectedPersonId", personId);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500">Profile</span>

      <select
        value={selectedPersonId}
        onChange={(event) => handleProfileChange(event.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm outline-none hover:border-gray-400 focus:border-[#E16000]"
      >
        <option value="">Select profile</option>

        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.full_name} — {roleNameById.get(person.role_id) || "No role"}
          </option>
        ))}
      </select>

      {selectedPerson && (
        <span className="hidden rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 md:inline">
          {roleNameById.get(selectedPerson.role_id) || "No role"}
        </span>
      )}

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}