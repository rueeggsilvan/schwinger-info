// neue Komponente fuer die Bewertungs-Vorschau in Sternen
// wird auf SchwingerDetail-Seite eingebunden

import felderDefinition from '../pages/schwinger/bewertungsfelder.json'

export default function BewertungsVorschau({ bewertung }) {
  if (!bewertung) return null

  const renderSterne = (wert) => {
  const n = Math.min(5, Math.max(0, parseInt(wert))) || 0
  return (
    <span className="sterne-anzeige">
      {'★'.repeat(n)}
      <span className="sterne-leer">{'★'.repeat(5 - n)}</span>
    </span>
  )
}

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Bewertungsvorschau</h2>
      {felderDefinition.map((gruppe, i) => (
        <div key={i} className="border-b pb-4 mb-4">
          <h3 className="text-xl font-semibold mb-2">{gruppe.gruppe}</h3>

          {gruppe.matrix ? (
            <div className="table-wrapper">
            <table className="table-auto w-full border">
              <thead>
                <tr>
                  <th className="label-cell px-2 py-2">Eigenschaft</th>
                  {gruppe.kategorien.map((kat, k) => (
                    <th key={k} className="border px-2 py-1">{kat}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gruppe.felder.map((feld, fi) => (
                  <tr key={fi}>
                    <td className="label-cell px-2 py-2">{feld.label}</td>
                    {feld.names.map((name, ni) => {
                    const wert = bewertung[name];
                    const istZahl = !isNaN(parseInt(wert));
                    return (
                        <td key={ni} className="border px-2 py-1 text-center">
                        {istZahl ? (
                        renderSterne(wert)
                      ) : (
                        <span className="italic text-gray-500">–</span>
                      )}
                    </td>
                    );
                  })}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : (
            <div className="table-wrapper">
            <table className="table-auto w-full">
              <tbody>
                {gruppe.felder.map((feld, fi) => (
                  <tr key={fi} className="border-b">
                    <td className="label-cell px-2 py-2">{feld.label}</td>
                    <td className="px-2 py-2">
                      {console.log('Vorschau:', feld.name, '→', bewertung[feld.name])}
                      {!isNaN(parseInt(bewertung[feld.name])) ? (
                        renderSterne(bewertung[feld.name])
                      ) : (
                        <div className="italic text-gray-500">
                          {bewertung[feld.name] || '–'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
