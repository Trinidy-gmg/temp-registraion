import { redirect } from "next/navigation";

/** Legacy URL — redirects to the account overview. */
export default function LoggedInLegacyRedirect() {
  redirect("/signedin");
}
