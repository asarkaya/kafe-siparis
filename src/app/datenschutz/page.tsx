import { LegalPage } from "@/components/LegalPage";

// TODO: Vorlage – vor dem Livegang prüfen (lassen) und Platzhalter ersetzen.
export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <h2>1. Verantwortlicher</h2>
      <p>
        [Name des Betriebs], [Straße Hausnummer], [PLZ Ort], E-Mail: [E-Mail-Adresse]. Weitere
        Angaben finden Sie im Impressum.
      </p>

      <h2>2. Bestellungen am Tisch</h2>
      <p>
        Wenn Sie über den QR-Code an Ihrem Tisch bestellen, verarbeiten wir die bestellten Artikel,
        die Tischnummer, den Zeitpunkt, die gewählte Sprache und eine optionale Anmerkung. Für
        Tischbestellungen sind keine Angaben zu Ihrer Person erforderlich. Rechtsgrundlage ist Art. 6
        Abs. 1 lit. b DSGVO (Vertragserfüllung). Bestelldaten werden gelöscht, sobald sie für die
        Abwicklung und gesetzliche Aufbewahrungspflichten nicht mehr benötigt werden.
      </p>

      <h2>3. Hosting und Datenbank</h2>
      <p>
        Die Bestelldaten werden bei Supabase gespeichert. Die Datenbank befindet sich in einem
        Rechenzentrum in Frankfurt am Main (EU). Mit dem Anbieter besteht ein Vertrag zur
        Auftragsverarbeitung (Art. 28 DSGVO). Die Website wird gehostet bei: [Hosting-Anbieter].
      </p>

      <h2>4. Cookies und lokale Speicherung</h2>
      <p>
        Wir verwenden nur technisch notwendige Speicherungen: ein Cookie für die gewählte Sprache,
        den Warenkorb im Sitzungsspeicher Ihres Browsers und – nur für Mitarbeitende – ein
        Anmelde-Cookie. Es findet kein Tracking und keine Werbung statt (§ 25 Abs. 2 TDDDG).
      </p>

      <h2>5. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
        Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht auf Beschwerde bei
        einer Datenschutz-Aufsichtsbehörde.
      </p>
    </LegalPage>
  );
}
