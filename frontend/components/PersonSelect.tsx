type PersonOption = {
  id: string;
  full_name: string;
};

type PersonSelectProps = {
  label: string;
  value: string;
  people: PersonOption[];
  onChange: (value: string) => void;
};

export default function PersonSelect({
  label,
  value,
  people,
  onChange,
}: PersonSelectProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E16000]"
      >
        <option value="">Select person</option>

        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.full_name}
          </option>
        ))}
      </select>
    </label>
  );
}