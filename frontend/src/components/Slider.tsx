interface SliderProps {
  label: string;
  symbol?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  format?: (v: number) => string;
  logarithmic?: boolean;
  onChange: (v: number) => void;
}

// A labeled slider with optional logarithmic mapping for wide-ranging constants.
export function Slider({
  label,
  symbol,
  value,
  min,
  max,
  step,
  unit,
  format,
  logarithmic,
  onChange,
}: SliderProps) {
  const toSlider = (v: number) =>
    logarithmic ? Math.log10(v) : v;
  const fromSlider = (s: number) =>
    logarithmic ? Math.pow(10, s) : s;

  const sMin = logarithmic ? Math.log10(min) : min;
  const sMax = logarithmic ? Math.log10(max) : max;
  const sStep = logarithmic ? (sMax - sMin) / 100 : step;

  const display = format
    ? format(value)
    : `${value % 1 === 0 ? value : value.toFixed(2)}${unit ?? ""}`;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-sm text-cosmos-accent2">
          {label}
          {symbol && (
            <span className="ml-1 text-xs text-gray-400 italic">{symbol}</span>
          )}
        </label>
        <span className="text-sm font-mono text-cosmos-star">{display}</span>
      </div>
      <input
        type="range"
        min={sMin}
        max={sMax}
        step={sStep}
        value={toSlider(value)}
        onChange={(e) => onChange(fromSlider(parseFloat(e.target.value)))}
        className="w-full"
      />
    </div>
  );
}
