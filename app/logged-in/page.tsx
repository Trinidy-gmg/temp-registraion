import { redirect } from "next/navigation";

/** Old path; faux site uses `/signedin`. */
export default function LoggedInLegacyRedirect() {
  redirect("/signedin");
}
