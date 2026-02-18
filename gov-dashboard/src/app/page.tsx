import { redirect } from "next/navigation";

export default function Home() {
  // This automatically moves the user from '/' to '/dashboard'
  redirect("/dashboard");
}