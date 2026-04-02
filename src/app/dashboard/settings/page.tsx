import { redirect } from "next/navigation";

/** Settings (digest / email) hidden for now — see app-nav. */
export default function SettingsPage() {
  redirect("/dashboard");
}
