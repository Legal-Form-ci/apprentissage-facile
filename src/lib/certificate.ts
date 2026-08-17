// Certificat téléchargeable en PDF, avec le nom et la progression.

import { jsPDF } from "jspdf";
import { masteredCount, progressPercent, type Profile } from "./store";

export function downloadCertificate(profile: Profile, level: number) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = 297;

  doc.setFillColor(255, 247, 237);
  doc.rect(0, 0, 297, 210, "F");
  doc.setDrawColor(194, 65, 12);
  doc.setLineWidth(3);
  doc.rect(10, 10, 277, 190);

  doc.setTextColor(124, 45, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("CERTIFICAT DE REUSSITE", w / 2, 45, { align: "center" });

  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("N'nvle Declic - Le plaisir d'apprendre, pas a pas", w / 2, 58, { align: "center" });

  doc.setFontSize(14);
  doc.text("Ce certificat est remis a", w / 2, 82, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text(stripAccents(profile.name || "Apprenant(e)").toUpperCase(), w / 2, 100, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(15);
  doc.text(`Niveau ${level} valide - Jour ${profile.day} du parcours`, w / 2, 118, { align: "center" });
  doc.text(
    `${masteredCount(profile)} competences maitrisees - ${progressPercent(profile)}% de progression - ${profile.stars} etoiles`,
    w / 2,
    130,
    { align: "center" },
  );

  doc.setFontSize(12);
  const date = new Date().toLocaleDateString("fr-FR");
  doc.text(`Delivre le ${date}${profile.city ? ` a ${stripAccents(profile.city)}` : ""}`, w / 2, 148, {
    align: "center",
  });

  doc.setFont("helvetica", "italic");
  doc.text("Inocent KOFFI - Enseignant, N'nvle Declic", w / 2, 172, { align: "center" });

  doc.save(`certificat-nnvle-declic-niveau-${level}.pdf`);
}

function stripAccents(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
