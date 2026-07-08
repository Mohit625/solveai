import { Button } from "./ui/button";

const LANGUAGE_OPTIONS = [
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
];

export function LanguagePicker({ onSelect, disabled }) {
  return (
    <div className="space-y-2 rounded-md border border-dashed border-border p-4">
      <p className="text-sm text-muted-foreground">
        Couldn't confidently tell which language this is — pick one to continue:
      </p>
      <div className="flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            disabled={disabled}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
