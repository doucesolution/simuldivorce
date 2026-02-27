// Import React core hooks: useState for local state, useEffect for side effects, useRef for DOM references
import React, { useState, useEffect, useRef } from "react";
// Import useNavigate from React Router to programmatically navigate between pages
import { useNavigate } from "react-router-dom";
// Import icon components from lucide-react used throughout the page for visual cues:
// ChevronLeft = back arrow, Home = home button, User = identity icon,
// Building2 = firm/cabinet icon, Phone = phone icon, Mail = email icon,
// MapPin = address icon, Hash = bar number icon, Image = logo/image icon,
// Save = save button icon, Check = confirmation checkmark icon
import {
  ChevronLeft,
  Home,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Hash,
  Image,
  Save,
  Check,
} from "lucide-react";
// Import the SEO component to inject meta tags (title, description) for search engines and social sharing
import { SEO } from "../components/SEO";
// Import the lawyer profile persistence functions and TypeScript type:
// - loadLawyerProfile: reads the saved profile from localStorage
// - saveLawyerProfile: writes the current profile to localStorage
// - LawyerProfile: the type/interface describing all profile fields
import {
  loadLawyerProfile,
  saveLawyerProfile,
  type LawyerProfile,
} from "../services/lawyerProfileStore";

// Define the main LawyerProfilePage component as a React functional component.
// This page allows a lawyer to fill in their professional identity, firm details,
// and upload a logo — all of which get embedded into generated Word/PDF documents.
const LawyerProfilePage: React.FC = () => {
  // Hook to programmatically navigate (go back, go home, etc.)
  const navigate = useNavigate();
  // Ref attached to the hidden file <input>, used to trigger the file picker dialog programmatically
  const fileRef = useRef<HTMLInputElement>(null);
  // Boolean state tracking whether the profile was just saved, to show a brief "Saved" confirmation
  const [saved, setSaved] = useState(false);

  // Initialize the profile state by lazy-loading from localStorage via loadLawyerProfile.
  // Using a callback initializer ensures the read happens only once on mount.
  const [profile, setProfile] = useState<LawyerProfile>(() =>
    loadLawyerProfile(),
  );

  // On initial mount, scroll the page to the top so the user always starts at the top of the form
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Generic field updater: takes a field name from LawyerProfile and a new string value,
  // spreads the previous profile and overrides the target field, then resets the "saved" flag
  // so the user knows there are unsaved changes.
  const update = (field: keyof LawyerProfile, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
    setSaved(false);
  };

  // Handler for logo file uploads triggered by the hidden <input type="file">.
  // Validates file size (max 500 KB) and converts the image to a base64 data URL
  // using FileReader, then stores it in the profile state.
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Grab the first selected file, if any
    const file = e.target.files?.[0];
    // If the user cancelled the picker, do nothing
    if (!file) return;
    // Enforce a 500 KB size limit to keep localStorage usage reasonable
    if (file.size > 500_000) {
      alert("Le logo ne doit pas dépasser 500 Ko.");
      return;
    }
    // Create a FileReader to asynchronously read the file contents
    const reader = new FileReader();
    // When reading completes, store the resulting base64 data URL in the profile
    reader.onload = () => {
      update("logoDataUrl", reader.result as string);
    };
    // Start reading the file as a base64-encoded data URL (e.g. "data:image/png;base64,...")
    reader.readAsDataURL(file);
  };

  // Handler for the Save button: persists the current profile to localStorage,
  // shows a brief "Saved" confirmation for 2 seconds, then reverts to the default button label.
  const handleSave = () => {
    // Persist the full profile object into localStorage
    saveLawyerProfile(profile);
    // Flip the saved flag to true to trigger the green "Enregistré" confirmation style
    setSaved(true);
    // After 2 seconds, reset the flag so the button returns to its normal "Enregistrer" state
    setTimeout(() => setSaved(false), 2000);
  };

  // Begin JSX rendering — the entire page layout
  return (
    // Root container: full viewport height, dark background, flex column layout, white text, no overflow
    <div className="h-[100dvh] bg-[var(--color-deep-space)] flex flex-col relative text-white overflow-hidden">
      {/* SEO component: injects <title> and <meta description> tags for this page.
          noindex=true because this is a private lawyer tool, not meant for public search indexing. */}
      <SEO
        title="Profil Avocat — SimulDivorce Pro"
        description="Configurez votre profil avocat : identité, cabinet, logo."
        path="/profil-avocat"
        noindex={true}
      />

      {/* Decorative background glow effect — a large blurred cyan circle in the top-right corner
          to give the page its "deep space" aesthetic */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-plasma-cyan)]/10 rounded-full blur-[100px]" />

      {/* Header bar: sticky at the top with backdrop blur and a subtle bottom border.
          Contains a back button (left), the page title (center), and a home button (right).
          paddingTop accounts for the device safe area (e.g. notch on mobile). */}
      <div
        className="bg-black/20 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-50"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {/* Back button: navigates to the previous page in the browser history */}
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-white/10 group flex items-center justify-center"
        >
          {/* Left chevron icon, changes from gray to white on hover */}
          <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
        {/* Page title displayed in uppercase with wide letter-spacing and a glow effect */}
        <h1 className="text-sm font-bold tracking-widest uppercase text-glow">
          Profil Avocat
        </h1>
        {/* Home button: navigates back to the landing/dashboard page */}
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full hover:bg-white/10 group flex items-center justify-center"
          title="Accueil"
        >
          {/* Home icon, changes from gray to white on hover */}
          <Home className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </button>
      </div>

      {/* Main scrollable content area containing all profile form sections.
          Extra bottom padding ensures the sticky save button does not overlap content.
          Uses fade-in animation and hidden scrollbar for a clean look. */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-28 sm:pb-32 pt-6 animate-fade-in relative z-10 scrollbar-hide space-y-8">
        {/* ===== SECTION: Identity =====
            Groups the lawyer's personal/professional identity fields:
            full name, email, phone, and bar number. */}
        <div className="space-y-4">
          {/* Section header with a User icon and "Identité" label in teal */}
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-teal-400" />
            <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
              Identité
            </span>
          </div>

          {/* Glass-morphism card containing the identity input fields */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            {/* Full name input — the lawyer's name as it should appear on documents */}
            <InputRow
              icon={<User className="w-3.5 h-3.5" />}
              label="Nom complet"
              value={profile.fullName}
              onChange={(v) => update("fullName", v)}
              placeholder="Maître Dupont"
            />
            {/* Email input — the lawyer's professional contact email */}
            <InputRow
              icon={<Mail className="w-3.5 h-3.5" />}
              label="Email"
              value={profile.email}
              onChange={(v) => update("email", v)}
              placeholder="contact@cabinet.fr"
              type="email"
            />
            {/* Phone number input — professional phone number */}
            <InputRow
              icon={<Phone className="w-3.5 h-3.5" />}
              label="Téléphone"
              value={profile.phone}
              onChange={(v) => update("phone", v)}
              placeholder="01 23 45 67 89"
              type="tel"
            />
            {/* Bar number input — the lawyer's registration number at the bar association ("Toque") */}
            <InputRow
              icon={<Hash className="w-3.5 h-3.5" />}
              label="N° du barreau"
              value={profile.barNumber}
              onChange={(v) => update("barNumber", v)}
              placeholder="Toque 123"
            />
          </div>
        </div>

        {/* ===== SECTION: Cabinet (Law Firm) =====
            Groups the law firm's details: firm name, street address, and city/postal code. */}
        <div className="space-y-4">
          {/* Section header with a Building2 icon and "Cabinet" label in teal */}
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-teal-400" />
            <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
              Cabinet
            </span>
          </div>

          {/* Glass-morphism card containing the firm detail input fields */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            {/* Firm name input — the official name of the law firm */}
            <InputRow
              icon={<Building2 className="w-3.5 h-3.5" />}
              label="Nom du cabinet"
              value={profile.cabinetName}
              onChange={(v) => update("cabinetName", v)}
              placeholder="Cabinet Dupont & Associés"
            />
            {/* Street address input — physical address of the law firm */}
            <InputRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Adresse"
              value={profile.cabinetAddress}
              onChange={(v) => update("cabinetAddress", v)}
              placeholder="12 rue de la Paix"
            />
            {/* City and postal code input — city/zip for the firm's location */}
            <InputRow
              icon={<MapPin className="w-3.5 h-3.5" />}
              label="Ville / CP"
              value={profile.cabinetCity}
              onChange={(v) => update("cabinetCity", v)}
              placeholder="75001 Paris"
            />
          </div>
        </div>

        {/* ===== SECTION: Logo =====
            Allows the lawyer to upload (or remove) a firm logo image.
            The logo is stored as a base64 data URL and embedded into generated documents. */}
        <div className="space-y-4">
          {/* Section header with an Image icon and "Logo du cabinet" label in teal */}
          <div className="flex items-center space-x-2">
            <Image className="w-4 h-4 text-teal-400" />
            <span className="text-xs uppercase tracking-widest text-teal-400 font-bold">
              Logo du cabinet
            </span>
          </div>

          {/* Glass-morphism card for the logo upload area */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            {/* Conditional rendering: if a logo is already uploaded, show it with a delete option;
                otherwise, show a dashed upload zone that triggers the file picker on click. */}
            {profile.logoDataUrl ? (
              // Logo preview container — shows the uploaded logo and a "delete" button
              <div className="flex flex-col items-center space-y-4">
                {/* Display the uploaded logo as a small preview image */}
                <img
                  src={profile.logoDataUrl}
                  alt="Logo du cabinet"
                  className="w-32 h-32 object-contain rounded-xl bg-white/5 p-2"
                />
                {/* Button to remove the uploaded logo by clearing the data URL */}
                <button
                  onClick={() => update("logoDataUrl", "")}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Supprimer le logo
                </button>
              </div>
            ) : (
              // Upload zone — a dashed-border button that triggers the hidden file input
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-white/20 rounded-xl hover:border-teal-400/40 transition flex flex-col items-center space-y-2"
              >
                {/* Placeholder image icon shown in the empty upload zone */}
                <Image className="w-8 h-8 text-gray-500" />
                {/* Instruction text telling the user to click and the max file size */}
                <span className="text-xs text-gray-400">
                  Cliquez pour télécharger votre logo (max 500 Ko)
                </span>
              </button>
            )}
            {/* Hidden file input: triggered programmatically via fileRef.
                Accepts PNG, JPEG, and SVG image formats.
                On change (file selected), handleLogoUpload processes the file. */}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>
      </div>

      {/* ===== Sticky Save Button =====
          Fixed at the bottom of the viewport so it's always accessible.
          Uses a gradient overlay to smoothly blend into the dark background above. */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-deep-space)] via-[var(--color-deep-space)]/95 to-transparent z-30">
        {/* The save button: toggles between a teal "Enregistrer" state and a green "Enregistré" state.
            Dynamically applies different background colors and glow shadows based on the `saved` flag.
            active:scale-95 gives tactile feedback on press. */}
        <button
          onClick={handleSave}
          className={`w-full max-w-md mx-auto flex items-center justify-center space-x-2 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition transform active:scale-95 ${
            saved
              ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              : "bg-[var(--color-plasma-cyan)] hover:bg-[var(--accent-hover)] shadow-[0_0_20px_rgba(20,184,166,0.3)]"
          }`}
          style={{ color: "#ffffff" }}
        >
          {/* Conditional content: show a checkmark + "Enregistré" (Saved) when just saved,
              or a save icon + "Enregistrer le profil" (Save profile) otherwise */}
          {saved ? (
            <>
              {/* Green checkmark icon indicating successful save */}
              <Check className="w-5 h-5" />
              {/* "Enregistré" = French for "Saved" */}
              <span>Enregistré</span>
            </>
          ) : (
            <>
              {/* Floppy-disk save icon */}
              <Save className="w-5 h-5" />
              {/* "Enregistrer le profil" = French for "Save the profile" */}
              <span>Enregistrer le profil</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ── Reusable Input Row Component ──
// A generic labeled input row used throughout the profile form.
// Renders an icon + label above a styled text input.
// Accepts: icon (ReactNode), label (string), value (string), onChange callback,
// optional placeholder text, and optional input type (defaults to "text").
function InputRow({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    // Wrapper div for a single form row
    <div>
      {/* Label row: displays the icon and the field label in small uppercase text */}
      <label className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-gray-400 mb-2">
        {/* The icon passed as a prop (e.g. User, Mail, Phone, etc.) */}
        {icon}
        {/* The human-readable field label text */}
        <span>{label}</span>
      </label>
      {/* The actual text input: styled with a translucent background, rounded corners,
          teal focus ring, and placeholder text. Calls onChange with the new value on every keystroke. */}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 transition text-sm"
      />
    </div>
  );
}

// Default-export the LawyerProfilePage component so it can be used in the app's router
export default LawyerProfilePage;
