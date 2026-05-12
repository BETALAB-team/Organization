type FilterOption = {
  label: string;
  value: string;
};

type FilterBarProps = {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

export default function FilterBar({
  label,
  value,
  options,
  onChange,
}: FilterBarProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-600">
      <span>{label}</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#E16000]"
      >
        <option value="">All</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}