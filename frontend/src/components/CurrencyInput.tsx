// Import React library for JSX and component types
import React from "react";

/**
 * Format a raw numeric string with space thousand separators.
 *   "100000"   → "100 000"
 *   "2500.5"   → "2 500.5"
 *   ""         → ""
 */
// Utility function that inserts non-breaking space separators every 3 digits for display purposes
const formatWithSpaces = (raw: string): string => {
  // If the input string is empty or falsy, return an empty string immediately
  if (!raw) return "";
  // Convert the input to a string to guard against non-string inputs
  const str = String(raw);
  // Split the string at the decimal point to handle integer and decimal parts separately
  const [intPart, decPart] = str.split(".");
  // Use a regex lookahead to insert a non-breaking space (\u00A0) every 3 digits from the right
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0"); // non-breaking space
  // If there was a decimal part, rejoin it with a dot; otherwise return only the formatted integer part
  return decPart !== undefined ? `${formatted}.${decPart}` : formatted;
};

/** Strip formatting spaces to get a raw numeric string */
// Utility function that removes all whitespace (including non-breaking spaces) and replaces commas with dots
const stripSpaces = (formatted: string): string => {
  // Remove any normal space or non-breaking space characters, then replace comma with dot for decimal notation
  return formatted.replace(/[\s\u00A0]/g, "").replace(",", ".");
};

// TypeScript interface extending standard HTML input attributes but omitting type, onChange, and value
// to replace them with our own controlled value/onValueChange pattern
interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value" // Omit these because we provide custom controlled behavior
  > {
  // The raw numeric string value (e.g. "100000") that will be formatted for display
  value: string;
  // Callback invoked with the raw (unformatted) numeric string whenever the user types
  onValueChange: (rawValue: string) => void;
}

// CurrencyInput — a controlled input component that shows formatted currency values with space separators
// but exposes the raw numeric string to the parent via onValueChange
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value, // The raw numeric value from the parent component
  onValueChange, // Callback to notify the parent of value changes
  ...props // All other HTML input attributes (className, placeholder, etc.) are spread through
}) => {
  // Render a standard HTML text input with decimal keyboard on mobile
  return (
    <input
      {...props} /* Spread any additional HTML attributes (e.g. className, placeholder, disabled) onto the input */
      type="text" /* Use text type so we can control formatting — "number" type doesn't allow space separators */
      inputMode="decimal" /* Hint mobile browsers to show a numeric keyboard with a decimal point key */
      value={formatWithSpaces(
        value,
      )} /* Display the formatted value with space separators to the user */
      onChange={(e) => {
        // Strip all formatting from the user's input to get the raw numeric string
        const raw = stripSpaces(e.target.value);
        // Allow empty, or valid numeric input (digits with optional single decimal)
        // This regex ensures only valid numbers pass through: optional digits, optional dot, optional more digits
        if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
          // Notify the parent component with the clean raw numeric value
          onValueChange(raw);
        }
        // If the input doesn't match the pattern, silently ignore the keystroke (invalid character)
      }}
    />
  );
};
