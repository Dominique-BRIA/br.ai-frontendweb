import type { Metadata } from "next";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = {
  title: "Tableau de bord · <br/>",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <Dashboard />;
}
