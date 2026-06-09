import Layout from '../components/layout';

export default function Datenschutz() {
  return (
    <Layout>
      <div className="responsive-padding">
        <h1>Datenschutzerklärung</h1>
    
    <p>Für die Nutzung dieses Tools gelten grundsätzlich die Datenschutzbestimmungen des Nordostschweizer Schwingerverbandes (NOSV). Die vollständige und allgemeine Datenschutzerklärung des Verbandes finden Sie hier:</p>
    
    <p>
      <a href="https://nosv.esv.ch/datenschutz" target="_blank" rel="noopener noreferrer">
        <strong>&rarr;Zur allgemeinen Datenschutzerklärung des NOSV</strong>
      </a>
    </p>

    <h2>Technisches Hosting dieses Tools (Netlify)</h2>
    <p>Ergänzend zur allgemeinen Datenschutzerklärung weisen wir darauf hin, dass dieses spezifische Tool bei <strong>Netlify</strong> (Netlify, Inc., 44 Montgomery Street, Suite 300, San Francisco, California 94104, USA) gehostet wird.</p>
    
    <p>Beim Aufruf dieser Web-Applikation erfasst Netlify standardmässig technische Server-Logfiles. Dazu gehören unter anderem Ihre IP-Adresse, der verwendete Browsertyp, das Betriebssystem sowie der Zeitpunkt des Zugriffs. Die Erfassung dieser Daten ist technisch zwingend notwendig, um Ihnen dieses Tool fehlerfrei zur Verfügung zu stellen und die Netzwerksicherheit zu gewährleisten. Weitere Informationen dazu finden Sie in der <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von Netlify</a>.</p>
    
    <p><em>Stand: Juni 2026</em></p>
      </div>
    </Layout>
  );
}
