import { LegalPage } from "@/components/LegalPage";

// TODO: Platzhalter in [eckigen Klammern] durch die echten Angaben ersetzen (§ 5 DDG).
export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        [Name des Betriebs]
        <br />
        [Inhaber/in, Vor- und Nachname]
        <br />
        [Straße Hausnummer]
        <br />
        [PLZ Ort]
      </p>
      <h2>Kontakt</h2>
      <p>
        Telefon: [Telefonnummer]
        <br />
        E-Mail: [E-Mail-Adresse]
      </p>
      <h2>Umsatzsteuer-ID</h2>
      <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: [USt-IdNr., falls vorhanden]</p>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </LegalPage>
  );
}
