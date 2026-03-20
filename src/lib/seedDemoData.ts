import type { useEvolu } from "@/db/evolu";
import { dateToStr } from "@/lib/dates";

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dateToStr(d);
}

const today = () => daysFromNow(0);
const tomorrow = () => daysFromNow(1);
const inDays = (n: number) => daysFromNow(n);

type Evolu = ReturnType<typeof useEvolu>;

function ok<T>(result: { ok: true; value: T } | { ok: false }): T | null {
  return result.ok ? result.value : null;
}

export function seedDemoData(evolu: Evolu) {
  // ── Areas ──────────────────────────────────────────────────────
  const workArea = ok(evolu.insert("area", { name: "Arbeit", position: 0 }));
  const personalArea = ok(evolu.insert("area", { name: "Privat", position: 1 }));

  // ── Projects ───────────────────────────────────────────────────
  const websiteProject = ok(evolu.insert("project", {
    name: "Website Relaunch",
    position: 0,
    color: "#3b82f6",
  }));
  if (websiteProject && workArea) {
    evolu.update("project", { id: websiteProject.id, areaId: workArea.id } as never);
  }

  const appProject = ok(evolu.insert("project", {
    name: "Mobile App",
    position: 1,
    color: "#6366f1",
  }));
  if (appProject && workArea) {
    evolu.update("project", { id: appProject.id, areaId: workArea.id } as never);
  }

  const marketingProject = ok(evolu.insert("project", {
    name: "Marketing Kampagne",
    position: 2,
    color: "#ec4899",
  }));
  if (marketingProject && workArea) {
    evolu.update("project", { id: marketingProject.id, areaId: workArea.id } as never);
  }

  const homeProject = ok(evolu.insert("project", {
    name: "Wohnung",
    position: 3,
    color: "#10b981",
  }));
  if (homeProject && personalArea) {
    evolu.update("project", { id: homeProject.id, areaId: personalArea.id } as never);
  }

  const fitnessProject = ok(evolu.insert("project", {
    name: "Fitness",
    position: 4,
    color: "#f59e0b",
  }));
  if (fitnessProject && personalArea) {
    evolu.update("project", { id: fitnessProject.id, areaId: personalArea.id } as never);
  }

  const tripProject = ok(evolu.insert("project", {
    name: "Urlaub Lissabon",
    position: 5,
    color: "#14b8a6",
  }));
  if (tripProject && personalArea) {
    evolu.update("project", { id: tripProject.id, areaId: personalArea.id } as never);
  }

  const learningProject = ok(evolu.insert("project", {
    name: "Weiterbildung",
    position: 6,
    color: "#a855f7",
  }));

  // ── Tags ───────────────────────────────────────────────────────
  const urgentTag = ok(evolu.insert("tag", { name: "Dringend", position: 0, color: "#ef4444" }));
  const ideaTag = ok(evolu.insert("tag", { name: "Idee", position: 1, color: "#8b5cf6" }));
  const errandTag = ok(evolu.insert("tag", { name: "Besorgung", position: 2, color: "#06b6d4" }));
  const waitingTag = ok(evolu.insert("tag", { name: "Warten auf", position: 3, color: "#f97316" }));
  const quickTag = ok(evolu.insert("tag", { name: "Schnell erledigt", position: 4, color: "#22c55e" }));
  const meetingTag = ok(evolu.insert("tag", { name: "Meeting", position: 5, color: "#0ea5e9" }));

  // ── Helper to assign tags ─────────────────────────────────────
  function tagTodo(todoId: string, tagId: string | undefined) {
    if (tagId) evolu.insert("todoTag", { todoId, tagId } as never);
  }

  // ── Helper for checklist items ────────────────────────────────
  function addChecklist(todoId: string, items: { text: string; done?: boolean }[]) {
    items.forEach((item, i) => {
      evolu.insert("checklistItem", {
        todoId,
        text: item.text,
        isCompleted: item.done ? 1 : 0,
        position: i,
      } as never);
    });
  }

  // ── Inbox todos ────────────────────────────────────────────────
  let pos = 0;

  evolu.insert("todo", { title: "Reisepass verlängern", position: pos++, isCompleted: 0 });
  evolu.insert("todo", { title: "Zahnarzt anrufen", position: pos++, isCompleted: 0 });

  const inboxNote = ok(evolu.insert("todo", { title: "Geschenkideen für Mamas Geburtstag", position: pos++, isCompleted: 0 }));
  if (inboxNote) {
    evolu.update("todo", { id: inboxNote.id, notes: "- Buch über Gärten\n- Wellness-Gutschein\n- Kochkurs zusammen" } as never);
  }

  evolu.insert("todo", { title: "Alte Klamotten aussortieren", position: pos++, isCompleted: 0 });
  evolu.insert("todo", { title: "Fahrrad zur Inspektion bringen", position: pos++, isCompleted: 0 });

  // ── Today todos ────────────────────────────────────────────────
  const t1 = ok(evolu.insert("todo", { title: "Einkaufen gehen", position: pos++, isCompleted: 0 }));
  if (t1) {
    evolu.update("todo", { id: t1.id, whenDate: today() } as never);
    tagTodo(t1.id, errandTag?.id);
    addChecklist(t1.id, [
      { text: "Milch", done: true },
      { text: "Brot" },
      { text: "Tomaten" },
      { text: "Käse" },
      { text: "Olivenöl" },
    ]);
  }

  const t2 = ok(evolu.insert("todo", { title: "E-Mails beantworten", position: pos++, isCompleted: 0 }));
  if (t2) evolu.update("todo", { id: t2.id, whenDate: today() } as never);

  const t3 = ok(evolu.insert("todo", { title: "Paket zur Post bringen", position: pos++, isCompleted: 0 }));
  if (t3) {
    evolu.update("todo", { id: t3.id, whenDate: today() } as never);
    tagTodo(t3.id, errandTag?.id);
    tagTodo(t3.id, quickTag?.id);
  }

  const t4 = ok(evolu.insert("todo", { title: "Buch lesen", position: pos++, isCompleted: 0 }));
  if (t4) evolu.update("todo", { id: t4.id, whenDate: today(), whenEvening: 1 } as never);

  const t5 = ok(evolu.insert("todo", { title: "Wochenbericht schreiben", position: pos++, isCompleted: 0 }));
  if (t5) {
    evolu.update("todo", { id: t5.id, whenDate: today(), deadline: today() } as never);
    tagTodo(t5.id, urgentTag?.id);
  }

  // ── Upcoming todos ─────────────────────────────────────────────
  const u1 = ok(evolu.insert("todo", { title: "Paket abholen", position: pos++, isCompleted: 0 }));
  if (u1) evolu.update("todo", { id: u1.id, whenDate: tomorrow() } as never);

  const u2 = ok(evolu.insert("todo", { title: "Steuererklärung vorbereiten", position: pos++, isCompleted: 0 }));
  if (u2) {
    evolu.update("todo", { id: u2.id, whenDate: inDays(3), deadline: inDays(7) } as never);
    evolu.update("todo", { id: u2.id, notes: "Belege von 2025 zusammensuchen.\nElster-Zugang prüfen." } as never);
  }

  const u3 = ok(evolu.insert("todo", { title: "Geschenk für Lisa besorgen", position: pos++, isCompleted: 0 }));
  if (u3) {
    evolu.update("todo", { id: u3.id, whenDate: inDays(5) } as never);
    tagTodo(u3.id, errandTag?.id);
  }

  const u4 = ok(evolu.insert("todo", { title: "Auto zum TÜV", position: pos++, isCompleted: 0 }));
  if (u4) {
    evolu.update("todo", { id: u4.id, whenDate: inDays(4), deadline: inDays(10) } as never);
    tagTodo(u4.id, errandTag?.id);
  }

  const u5 = ok(evolu.insert("todo", { title: "Friseurtermin", position: pos++, isCompleted: 0 }));
  if (u5) evolu.update("todo", { id: u5.id, whenDate: inDays(2) } as never);

  const u6 = ok(evolu.insert("todo", { title: "Geburtstag Max — Karte schreiben", position: pos++, isCompleted: 0 }));
  if (u6) evolu.update("todo", { id: u6.id, whenDate: inDays(6) } as never);

  const u7 = ok(evolu.insert("todo", { title: "Miete überweisen", position: pos++, isCompleted: 0 }));
  if (u7) evolu.update("todo", { id: u7.id, whenDate: inDays(8), recurrenceRule: "FREQ=MONTHLY;INTERVAL=1" } as never);

  // ── Someday todos ──────────────────────────────────────────────
  const somedayItems = [
    { title: "Japanisch lernen", tags: [ideaTag?.id] },
    { title: "Podcast starten", tags: [ideaTag?.id] },
    { title: "Klettern ausprobieren", tags: [ideaTag?.id] },
    { title: "Ehrenamt finden", tags: [] as (string | undefined)[] },
    { title: "Fotografie-Kurs machen", tags: [ideaTag?.id] },
    { title: "Eigenes Sauerteigbrot backen", tags: [ideaTag?.id] },
  ];
  somedayItems.forEach((item) => {
    const s = ok(evolu.insert("todo", { title: item.title, position: pos++, isCompleted: 0 }));
    if (s) {
      evolu.update("todo", { id: s.id, whenSomeday: 1 } as never);
      item.tags.forEach((tid) => tagTodo(s.id, tid));
    }
  });

  // ── Project: Website Relaunch ──────────────────────────────────
  if (websiteProject) {
    const pid = websiteProject.id;

    // Headings
    const designHeading = ok(evolu.insert("projectHeading", { projectId: pid, title: "Design", position: 0 } as never));
    const devHeading = ok(evolu.insert("projectHeading", { projectId: pid, title: "Entwicklung", position: 1 } as never));
    const launchHeading = ok(evolu.insert("projectHeading", { projectId: pid, title: "Launch", position: 2 } as never));

    // Design
    const w1 = ok(evolu.insert("todo", { title: "Wireframes erstellen", position: 0, isCompleted: 0 }));
    if (w1) evolu.update("todo", { id: w1.id, projectId: pid, whenDate: today() } as never);

    const w2 = ok(evolu.insert("todo", { title: "Moodboard zusammenstellen", position: 1, isCompleted: 0 }));
    if (w2) {
      evolu.update("todo", { id: w2.id, projectId: pid, isCompleted: 1, completedAt: new Date().toISOString() } as never);
    }

    const w3 = ok(evolu.insert("todo", { title: "Farbpalette festlegen", position: 2, isCompleted: 0 }));
    if (w3) {
      evolu.update("todo", { id: w3.id, projectId: pid, isCompleted: 1, completedAt: new Date().toISOString() } as never);
    }

    // Entwicklung
    const w4 = ok(evolu.insert("todo", { title: "Texte schreiben", position: 3, isCompleted: 0 }));
    if (w4) {
      evolu.update("todo", { id: w4.id, projectId: pid, whenDate: inDays(2) } as never);
      tagTodo(w4.id, urgentTag?.id);
    }

    const w5 = ok(evolu.insert("todo", { title: "Design Review mit Team", position: 4, isCompleted: 0 }));
    if (w5) {
      evolu.update("todo", { id: w5.id, projectId: pid, whenDate: inDays(4) } as never);
      tagTodo(w5.id, meetingTag?.id);
    }

    const w6 = ok(evolu.insert("todo", { title: "Responsive Tests", position: 5, isCompleted: 0 }));
    if (w6) {
      evolu.update("todo", { id: w6.id, projectId: pid } as never);
      addChecklist(w6.id, [
        { text: "iPhone SE" },
        { text: "iPhone 15 Pro" },
        { text: "iPad" },
        { text: "Desktop 1920px" },
        { text: "Desktop 2560px" },
      ]);
    }

    const w7 = ok(evolu.insert("todo", { title: "SEO-Optimierung", position: 6, isCompleted: 0 }));
    if (w7) evolu.update("todo", { id: w7.id, projectId: pid } as never);

    // Launch
    const w8 = ok(evolu.insert("todo", { title: "Hosting einrichten", position: 7, isCompleted: 0 }));
    if (w8) evolu.update("todo", { id: w8.id, projectId: pid } as never);

    const w9 = ok(evolu.insert("todo", { title: "Domain registrieren", position: 8, isCompleted: 0 }));
    if (w9) evolu.update("todo", { id: w9.id, projectId: pid, isCompleted: 1, completedAt: new Date().toISOString() } as never);

    const w10 = ok(evolu.insert("todo", { title: "SSL-Zertifikat einrichten", position: 9, isCompleted: 0 }));
    if (w10) evolu.update("todo", { id: w10.id, projectId: pid } as never);

    const w11 = ok(evolu.insert("todo", { title: "Go-Live Datum festlegen", position: 10, isCompleted: 0 }));
    if (w11) {
      evolu.update("todo", { id: w11.id, projectId: pid, whenDate: inDays(14), deadline: inDays(14) } as never);
      tagTodo(w11.id, urgentTag?.id);
    }

    void designHeading;
    void devHeading;
    void launchHeading;
  }

  // ── Project: Mobile App ────────────────────────────────────────
  if (appProject) {
    const pid = appProject.id;

    ok(evolu.insert("projectHeading", { projectId: pid, title: "Planung", position: 0 } as never));
    ok(evolu.insert("projectHeading", { projectId: pid, title: "Implementierung", position: 1 } as never));
    ok(evolu.insert("projectHeading", { projectId: pid, title: "Testing", position: 2 } as never));

    const a1 = ok(evolu.insert("todo", { title: "User Stories definieren", position: 0, isCompleted: 0 }));
    if (a1) {
      evolu.update("todo", { id: a1.id, projectId: pid, isCompleted: 1, completedAt: new Date().toISOString() } as never);
    }

    const a2 = ok(evolu.insert("todo", { title: "Tech-Stack festlegen", position: 1, isCompleted: 0 }));
    if (a2) {
      evolu.update("todo", { id: a2.id, projectId: pid, isCompleted: 1, completedAt: new Date().toISOString() } as never);
      evolu.update("todo", { id: a2.id, notes: "React Native mit Expo — einfacheres Deployment" } as never);
    }

    const a3 = ok(evolu.insert("todo", { title: "API-Schnittstellen planen", position: 2, isCompleted: 0 }));
    if (a3) {
      evolu.update("todo", { id: a3.id, projectId: pid, whenDate: today() } as never);
      tagTodo(a3.id, meetingTag?.id);
    }

    const a4 = ok(evolu.insert("todo", { title: "Login-Screen implementieren", position: 3, isCompleted: 0 }));
    if (a4) evolu.update("todo", { id: a4.id, projectId: pid, whenDate: inDays(3) } as never);

    const a5 = ok(evolu.insert("todo", { title: "Push-Benachrichtigungen einrichten", position: 4, isCompleted: 0 }));
    if (a5) evolu.update("todo", { id: a5.id, projectId: pid } as never);

    const a6 = ok(evolu.insert("todo", { title: "Offline-Modus testen", position: 5, isCompleted: 0 }));
    if (a6) evolu.update("todo", { id: a6.id, projectId: pid } as never);

    const a7 = ok(evolu.insert("todo", { title: "Beta-Tester einladen", position: 6, isCompleted: 0 }));
    if (a7) {
      evolu.update("todo", { id: a7.id, projectId: pid, whenDate: inDays(10) } as never);
      tagTodo(a7.id, waitingTag?.id);
    }
  }

  // ── Project: Marketing Kampagne ────────────────────────────────
  if (marketingProject) {
    const pid = marketingProject.id;

    const m1 = ok(evolu.insert("todo", { title: "Zielgruppe analysieren", position: 0, isCompleted: 0 }));
    if (m1) evolu.update("todo", { id: m1.id, projectId: pid, isCompleted: 1, completedAt: new Date().toISOString() } as never);

    const m2 = ok(evolu.insert("todo", { title: "Content-Plan erstellen", position: 1, isCompleted: 0 }));
    if (m2) {
      evolu.update("todo", { id: m2.id, projectId: pid, whenDate: tomorrow() } as never);
      addChecklist(m2.id, [
        { text: "Blog-Artikel Themen", done: true },
        { text: "Social Media Posts planen" },
        { text: "Newsletter-Sequenz" },
        { text: "Video-Content Ideen" },
      ]);
    }

    const m3 = ok(evolu.insert("todo", { title: "Social Media Grafiken designen", position: 2, isCompleted: 0 }));
    if (m3) evolu.update("todo", { id: m3.id, projectId: pid, whenDate: inDays(3) } as never);

    const m4 = ok(evolu.insert("todo", { title: "Newsletter-Tool einrichten", position: 3, isCompleted: 0 }));
    if (m4) {
      evolu.update("todo", { id: m4.id, projectId: pid } as never);
      evolu.update("todo", { id: m4.id, notes: "Mailchimp oder Brevo vergleichen" } as never);
    }

    const m5 = ok(evolu.insert("todo", { title: "Kampagne A/B-Tests planen", position: 4, isCompleted: 0 }));
    if (m5) evolu.update("todo", { id: m5.id, projectId: pid, whenDate: inDays(7) } as never);

    const m6 = ok(evolu.insert("todo", { title: "Budget freigeben lassen", position: 5, isCompleted: 0 }));
    if (m6) {
      evolu.update("todo", { id: m6.id, projectId: pid, deadline: inDays(5) } as never);
      tagTodo(m6.id, waitingTag?.id);
      tagTodo(m6.id, urgentTag?.id);
    }
  }

  // ── Project: Wohnung ───────────────────────────────────────────
  if (homeProject) {
    const pid = homeProject.id;

    ok(evolu.insert("projectHeading", { projectId: pid, title: "Renovierung", position: 0 } as never));
    ok(evolu.insert("projectHeading", { projectId: pid, title: "Einrichtung", position: 1 } as never));

    const h1 = ok(evolu.insert("todo", { title: "Wohnzimmer streichen", position: 0, isCompleted: 0 }));
    if (h1) {
      evolu.update("todo", { id: h1.id, projectId: pid, whenDate: inDays(8) } as never);
      addChecklist(h1.id, [
        { text: "Farbe kaufen (Alpinaweiß)" },
        { text: "Abdeckfolie besorgen" },
        { text: "Möbel zur Seite schieben" },
        { text: "Streichen" },
        { text: "Aufräumen" },
      ]);
    }

    const h2 = ok(evolu.insert("todo", { title: "Neue Lampen bestellen", position: 1, isCompleted: 0 }));
    if (h2) {
      evolu.update("todo", { id: h2.id, projectId: pid } as never);
      tagTodo(h2.id, errandTag?.id);
      evolu.update("todo", { id: h2.id, notes: "IKEA HEKTAR oder Muuto Ambit" } as never);
    }

    const h3 = ok(evolu.insert("todo", { title: "Balkon aufräumen", position: 2, isCompleted: 0 }));
    if (h3) evolu.update("todo", { id: h3.id, projectId: pid, whenDate: inDays(6) } as never);

    const h4 = ok(evolu.insert("todo", { title: "Regale montieren", position: 3, isCompleted: 0 }));
    if (h4) evolu.update("todo", { id: h4.id, projectId: pid } as never);

    const h5 = ok(evolu.insert("todo", { title: "Schlüssel nachmachen lassen", position: 4, isCompleted: 0 }));
    if (h5) {
      evolu.update("todo", { id: h5.id, projectId: pid, isCompleted: 1, completedAt: new Date().toISOString() } as never);
      tagTodo(h5.id, quickTag?.id);
    }

    const h6 = ok(evolu.insert("todo", { title: "Internet-Anbieter wechseln", position: 5, isCompleted: 0 }));
    if (h6) {
      evolu.update("todo", { id: h6.id, projectId: pid, deadline: inDays(14) } as never);
      tagTodo(h6.id, waitingTag?.id);
    }
  }

  // ── Project: Fitness ───────────────────────────────────────────
  if (fitnessProject) {
    const pid = fitnessProject.id;

    const f1 = ok(evolu.insert("todo", { title: "Trainingsplan erstellen", position: 0, isCompleted: 0 }));
    if (f1) evolu.update("todo", { id: f1.id, projectId: pid, whenDate: tomorrow() } as never);

    const f2 = ok(evolu.insert("todo", { title: "Laufschuhe kaufen", position: 1, isCompleted: 0 }));
    if (f2) {
      evolu.update("todo", { id: f2.id, projectId: pid } as never);
      tagTodo(f2.id, errandTag?.id);
    }

    const f3 = ok(evolu.insert("todo", { title: "Joggen gehen", position: 2, isCompleted: 0 }));
    if (f3) evolu.update("todo", { id: f3.id, projectId: pid, whenDate: tomorrow(), recurrenceRule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR" } as never);

    const f4 = ok(evolu.insert("todo", { title: "Ernährungsplan recherchieren", position: 3, isCompleted: 0 }));
    if (f4) {
      evolu.update("todo", { id: f4.id, projectId: pid, whenSomeday: 1 } as never);
      tagTodo(f4.id, ideaTag?.id);
    }

    const f5 = ok(evolu.insert("todo", { title: "Yoga-Kurs anmelden", position: 4, isCompleted: 0 }));
    if (f5) evolu.update("todo", { id: f5.id, projectId: pid, whenDate: inDays(3) } as never);

    const f6 = ok(evolu.insert("todo", { title: "5km Lauf geschafft!", position: 5, isCompleted: 0 }));
    if (f6) evolu.update("todo", { id: f6.id, projectId: pid, isCompleted: 1, completedAt: new Date().toISOString() } as never);
  }

  // ── Project: Urlaub Lissabon ───────────────────────────────────
  if (tripProject) {
    const pid = tripProject.id;

    ok(evolu.insert("projectHeading", { projectId: pid, title: "Planung", position: 0 } as never));
    ok(evolu.insert("projectHeading", { projectId: pid, title: "Vor Ort", position: 1 } as never));

    const tr1 = ok(evolu.insert("todo", { title: "Flüge buchen", position: 0, isCompleted: 0 }));
    if (tr1) evolu.update("todo", { id: tr1.id, projectId: pid, isCompleted: 1, completedAt: new Date().toISOString() } as never);

    const tr2 = ok(evolu.insert("todo", { title: "Hotel reservieren", position: 1, isCompleted: 0 }));
    if (tr2) {
      evolu.update("todo", { id: tr2.id, projectId: pid, whenDate: inDays(2), deadline: inDays(5) } as never);
      tagTodo(tr2.id, urgentTag?.id);
    }

    const tr3 = ok(evolu.insert("todo", { title: "Reiseversicherung abschließen", position: 2, isCompleted: 0 }));
    if (tr3) evolu.update("todo", { id: tr3.id, projectId: pid, whenDate: inDays(7) } as never);

    const tr4 = ok(evolu.insert("todo", { title: "Packliste erstellen", position: 3, isCompleted: 0 }));
    if (tr4) {
      evolu.update("todo", { id: tr4.id, projectId: pid } as never);
      addChecklist(tr4.id, [
        { text: "Reisepass" },
        { text: "Adapter Typ F" },
        { text: "Sonnencreme" },
        { text: "Reiseführer" },
        { text: "Bequeme Schuhe" },
        { text: "Kamera + Ladegerät" },
      ]);
    }

    const tr5 = ok(evolu.insert("todo", { title: "Restaurants recherchieren", position: 4, isCompleted: 0 }));
    if (tr5) {
      evolu.update("todo", { id: tr5.id, projectId: pid } as never);
      evolu.update("todo", { id: tr5.id, notes: "Pastéis de Belém nicht vergessen!\nTime Out Market besuchen." } as never);
    }

    const tr6 = ok(evolu.insert("todo", { title: "Tagesausflug Sintra planen", position: 5, isCompleted: 0 }));
    if (tr6) evolu.update("todo", { id: tr6.id, projectId: pid } as never);

    const tr7 = ok(evolu.insert("todo", { title: "Nachbarin wegen Blumen gießen fragen", position: 6, isCompleted: 0 }));
    if (tr7) {
      evolu.update("todo", { id: tr7.id, projectId: pid, whenDate: inDays(12) } as never);
      tagTodo(tr7.id, quickTag?.id);
    }
  }

  // ── Project: Weiterbildung ─────────────────────────────────────
  if (learningProject) {
    const pid = learningProject.id;

    const l1 = ok(evolu.insert("todo", { title: "TypeScript Advanced Kurs abschließen", position: 0, isCompleted: 0 }));
    if (l1) {
      evolu.update("todo", { id: l1.id, projectId: pid, whenDate: inDays(1) } as never);
      addChecklist(l1.id, [
        { text: "Generics Kapitel", done: true },
        { text: "Conditional Types", done: true },
        { text: "Template Literal Types" },
        { text: "Mapped Types" },
        { text: "Abschlussprojekt" },
      ]);
    }

    const l2 = ok(evolu.insert("todo", { title: "Fachbuch \"Clean Architecture\" lesen", position: 1, isCompleted: 0 }));
    if (l2) evolu.update("todo", { id: l2.id, projectId: pid } as never);

    const l3 = ok(evolu.insert("todo", { title: "Konferenz-Tickets kaufen", position: 2, isCompleted: 0 }));
    if (l3) {
      evolu.update("todo", { id: l3.id, projectId: pid, deadline: inDays(21) } as never);
      evolu.update("todo", { id: l3.id, notes: "JSConf EU — Early Bird endet bald" } as never);
    }

    const l4 = ok(evolu.insert("todo", { title: "Blogpost über Evolu schreiben", position: 3, isCompleted: 0 }));
    if (l4) {
      evolu.update("todo", { id: l4.id, projectId: pid, whenSomeday: 1 } as never);
      tagTodo(l4.id, ideaTag?.id);
    }

    const l5 = ok(evolu.insert("todo", { title: "Meetup-Vortrag vorbereiten", position: 4, isCompleted: 0 }));
    if (l5) {
      evolu.update("todo", { id: l5.id, projectId: pid, whenDate: inDays(9) } as never);
      tagTodo(l5.id, meetingTag?.id);
    }
  }
}
