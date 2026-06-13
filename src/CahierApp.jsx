/* ============================================================
   NANAMOUREUX — App "Cahier" (routes internes + shell)
   ============================================================ */
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { NanaProvider, useNana } from "./lib/store.jsx";
import { Shell } from "./components/Shell.jsx";
import Accueil from "./pages/Accueil";
import Defi from "./pages/Defi";
import Courses from "./pages/Courses";
import Agenda from "./pages/Agenda";
import Poesie from "./pages/Poesie";
import Idees from "./pages/Idees";
import Budget from "./pages/Budget";
import Messages from "./pages/Messages";
import Reglages from "./pages/Reglages";

const PAGES = {
  accueil: Accueil,
  defi: Defi,
  courses: Courses,
  agenda: Agenda,
  poesie: Poesie,
  idees: Idees,
  budget: Budget,
  messages: Messages,
  reglages: Reglages,
};

function CahierShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useNana();

  const id = location.pathname.replace(/^\/+/, "") || "accueil";
  const route = PAGES[id] ? id : "accueil";
  const Comp = PAGES[route];
  const go = (next) => navigate(next === "accueil" ? "/" : `/${next}`);

  useEffect(() => {
    if (!PAGES[id] && id !== "accueil") navigate("/", { replace: true });
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", fontFamily: "var(--font-ui)", fontWeight: 700, color: "var(--muted)" }}>
        Chargement…
      </div>
    );
  }

  return (
    <Shell route={route} go={go}>
      <Comp key={route} go={go} />
    </Shell>
  );
}

export default function CahierApp() {
  return (
    <NanaProvider>
      <CahierShell />
    </NanaProvider>
  );
}
