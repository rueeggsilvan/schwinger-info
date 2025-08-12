import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/layout'
import felderDefinition from '../pages/schwinger/bewertungsfelder.json'
import { PDFDocument } from 'pdf-lib'

// Unicode-fähige Fonts (Base64)
import DejaVuSansData from '../src/fonts/DejaVuSans-normal.js'
import DejaVuSansBoldData from '../src/fonts/DejaVuSans-bold.js'

const COLORS = {
  primary: [0, 102, 204],
  headFill: [245, 247, 250],
  border: [220, 224, 229],
  text: [33, 37, 41],
  subheadFill: [240, 248, 255],
  star: [218, 165, 32],
}

export default function SchwingerListe() {
  const [schwinger, setSchwinger] = useState([])
  const [filtered, setFiltered] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bewertungsMap, setBewertungsMap] = useState({})
  const [filterBewertet, setFilterBewertet] = useState('alle')

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { data: schwingerData, error: schwingerError } = await supabase
        .from('schwinger')
        .select('id, name, vorname, wohnort, tv')
        .order('name', { ascending: true })

      if (schwingerError) {
        setError(schwingerError.message)
        setLoading(false)
        return
      }

      setSchwinger(schwingerData)

      const { data: bewertungenData, error: bewertungenError } = await supabase
        .from('bewertungen')
        .select('schwinger_id')

      if (bewertungenError) {
        setError(bewertungenError.message)
        setLoading(false)
        return
      }

      const map = {}
      bewertungenData.forEach(b => {
        if (b.schwinger_id) map[b.schwinger_id] = true
      })

      setBewertungsMap(map)
      setLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    const lower = search.toLowerCase()
    setFiltered(
      schwinger.filter(s => {
        const matchSearch = Object.values(s).some(val =>
          String(val || '').toLowerCase().includes(lower)
        )
        const bewertet = !!bewertungsMap[s.id]
        const matchBewertet =
          filterBewertet === 'alle' ||
          (filterBewertet === 'ja' && bewertet) ||
          (filterBewertet === 'nein' && !bewertet)

        return matchSearch && matchBewertet
      })
    )
  }, [search, schwinger, filterBewertet, bewertungsMap])

  const toggleSelect = (id) => {
    const newSelected = new Set(selected)
    if (newSelected.has(id)) newSelected.delete(id)
    else newSelected.add(id)
    setSelected(newSelected)
  }

  const selectAll = () => setSelected(new Set(filtered.map(s => s.id)))
  const deselectAll = () => setSelected(new Set())

  const renderSterne = (wert) => {
    const n = Math.min(5, Math.max(0, parseInt(wert))) || 0
    const full = '\u2605'.repeat(n)
    const empty = '\u2606'.repeat(5 - n)
    return full + empty
  }

  const addHeader = (pdf, s) => {
    const w = pdf.internal.pageSize.getWidth()
    pdf.setFont('DejaVu', 'bold')
    pdf.setTextColor(...COLORS.primary)
    pdf.setFontSize(17)
    pdf.text(`${s.name} ${s.vorname}`, 40, 50)

    pdf.setFont('DejaVu', 'normal')
    pdf.setTextColor(...COLORS.text)
    pdf.setFontSize(11)
    pdf.text(`Wohnort: ${s.wohnort || '-'}`, 40, 70)
    pdf.text(`Teilverband: ${s.tv || '-'}`, 40, 86)

    pdf.setDrawColor(...COLORS.border)
    pdf.setLineWidth(0.8)
    pdf.line(40, 98, w - 40, 98)
  }

  // kleine Helper zum Speichern eines ArrayBuffers als Datei
  const saveBytesAsFile = (bytes, filename) => {
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownload = async () => {
    if (selected.size === 0) {
      alert('Bitte mindestens einen Schwinger auswählen.')
      return
    }

    const ids = Array.from(selected)

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]

      // WICHTIG: link_pdf mitladen
      const { data: schwingerData, error: schwingerError } = await supabase
        .from('schwinger')
        .select(`vorname, name, wohnort, tv, link_pdf`)
        .eq('id', id)
        .single()

      if (schwingerError) {
        alert(`Fehler beim Laden von Schwinger ${id}: ${schwingerError.message}`)
        continue
      }

      const { data: bewertungen, error: bewertungenError } = await supabase
        .from('bewertungen')
        .select(`*`)
        .eq('schwinger_id', id)
        .order('id', { ascending: true })

      if (bewertungenError) {
        alert(`Fehler beim Laden der Bewertungen für Schwinger ${id}: ${bewertungenError.message}`)
        continue
      }

      // 1) Dein Bewertungs-PDF mit jsPDF bauen
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      pdf.addFileToVFS('DejaVuSans.ttf', DejaVuSansData)
      pdf.addFont('DejaVuSans.ttf', 'DejaVu', 'normal')
      pdf.addFileToVFS('DejaVuSans-bold.ttf', DejaVuSansBoldData)
      pdf.addFont('DejaVuSans-bold.ttf', 'DejaVu', 'bold')
      pdf.setFont('DejaVu', 'normal')
      pdf.setTextColor(...COLORS.text)

      addHeader(pdf, schwingerData)

      let cursorY = 114
      const margin = { left: 40, right: 40, top: 114, bottom: 48 }

      const baseTableOpts = {
        margin,
        theme: 'grid',
        styles: {
          font: 'DejaVu',
          fontSize: 10,
          cellPadding: 4,
          minCellHeight: 14,
          valign: 'middle',
          textColor: COLORS.text,
          lineColor: COLORS.border,
        },
        headStyles: {
          font: 'DejaVu',
          fontStyle: 'bold',
          fillColor: COLORS.headFill,
          textColor: COLORS.text,
          lineColor: COLORS.border,
        },
        alternateRowStyles: { fillColor: [253, 253, 253] },
        didParseCell: (data) => {
          const t = data.cell?.text?.[0]
          if (typeof t === 'string' && t.includes('★')) {
            data.cell.styles.textColor = COLORS.star
            data.cell.styles.fontStyle = 'bold'
          }
        },
        didDrawPage: () => addHeader(pdf, schwingerData),
      }

      bewertungen.forEach((b, idx) => {
        autoTable(pdf, {
          startY: cursorY,
          margin,
          theme: 'plain',
          body: [[{ content: `Bewertung ${idx + 1}`, styles: { font: 'DejaVu', fontSize: 12, fontStyle: 'bold', textColor: COLORS.primary } }]],
          styles: { font: 'DejaVu', cellPadding: { top: 1, bottom: 0, left: 0, right: 0 } },
          didDrawPage: () => addHeader(pdf, schwingerData),
        })
        cursorY = pdf.lastAutoTable.finalY + 4

        const kommentar = b.kommentar || '(kein Kommentar)'
        autoTable(pdf, {
          ...baseTableOpts,
          startY: cursorY,
          head: [[{ content: 'Kommentar', styles: { fontStyle: 'bold' } }]],
          body: [[kommentar]],
        })
        cursorY = pdf.lastAutoTable.finalY + 6

        felderDefinition.forEach((gruppe) => {
          autoTable(pdf, {
            startY: cursorY,
            margin,
            theme: 'plain',
            body: [[{ content: gruppe.gruppe, styles: {
              font: 'DejaVu', fontStyle: 'bold', textColor: COLORS.primary,
              fillColor: COLORS.subheadFill,
              cellPadding: { top: 3, bottom: 2, left: 6, right: 6 }
            }}]],
            styles: { font: 'DejaVu' },
            didDrawPage: () => addHeader(pdf, schwingerData),
          })
          cursorY = pdf.lastAutoTable.finalY + 3

          if (gruppe.matrix) {
            const bodyRows = gruppe.felder.map(feld => {
              const cells = feld.names.map(name => {
                const wert = b[name]
                const istZahl = !isNaN(parseInt(wert))
                return istZahl ? renderSterne(wert) : (wert || '–')
              })
              return [feld.label, ...cells]
            })

            autoTable(pdf, {
              ...baseTableOpts,
              startY: cursorY,
              head: [['Eigenschaft', ...gruppe.kategorien]],
              body: bodyRows,
              columnStyles: { 0: { cellWidth: 190 } },
            })
            cursorY = pdf.lastAutoTable.finalY + 8
          } else {
            const bodyRows2 = gruppe.felder.map(feld => {
              const wert = b[feld.name]
              const istZahl = !isNaN(parseInt(wert))
              return [feld.label, istZahl ? renderSterne(wert) : (wert || '–')]
            })

            autoTable(pdf, {
              ...baseTableOpts,
              startY: cursorY,
              head: [['Eigenschaft', 'Wert']],
              body: bodyRows2,
              columnStyles: { 0: { cellWidth: 220 } },
            })
            cursorY = pdf.lastAutoTable.finalY + 8
          }
        })
      })

      // 2) Falls link_pdf da ist: externes PDF hinten anhängen
      const filename = `${schwingerData.name}_${schwingerData.vorname}_${schwingerData.wohnort}`
        .replace(/\s+/g, '_') + '.pdf'

      try {
        const baseBytes = pdf.output('arraybuffer')

        let finalBytes = baseBytes
        const url = (schwingerData.link_pdf || '').trim()

        if (url) {
            const resp = await fetch(`/api/fetch-pdf?u=${encodeURIComponent(url)}`)
          if (!resp.ok) throw new Error(`link_pdf nicht ladbar (${resp.status})`)
          const extBytes = await resp.arrayBuffer()

          const baseDoc = await PDFDocument.load(baseBytes)
          const extDoc = await PDFDocument.load(extBytes)

          const extPages = await baseDoc.copyPages(extDoc, extDoc.getPageIndices())
          extPages.forEach(p => baseDoc.addPage(p))

          finalBytes = await baseDoc.save()
        }

        // Speichern
        saveBytesAsFile(finalBytes, filename)
      } catch (e) {
        console.error('PDF-Merge fehlgeschlagen:', e)
        // Fallback: nur dein Bewertungs-PDF speichern
        pdf.save(filename)
      }
    }
  }

  return (
    <Layout>
      <div className="responsive-padding">
        <h1>Schwinger-Liste</h1>

        <input
          type="text"
          placeholder="Suche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: '1rem', width: '100%', padding: '0.5rem' }}
        />

        <label>
          Bewertet filtern:{' '}
          <select
            value={filterBewertet}
            onChange={(e) => setFilterBewertet(e.target.value)}
            style={{ marginBottom: '1rem' }}
          >
            <option value="alle">Alle</option>
            <option value="ja">Ja</option>
            <option value="nein">Nein</option>
          </select>
        </label>

        <div style={{ marginBottom: '1rem' }}>
          <button onClick={selectAll}>Alle markieren</button>
          <button onClick={deselectAll} style={{ marginLeft: '0.5rem' }}>
            Keine markieren
          </button>
          <button onClick={handleDownload}>Download</button>
        </div>

        {loading && <p>Lädt...</p>}
        {error && <p style={{ color: 'red' }}>Fehler: {error}</p>}

        {!loading && !error && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th></th>
                <th>Nachname</th>
                <th>Vorname</th>
                <th>Wohnort</th>
                <th>Teilverband</th>
                <th>ID</th>
                <th>Bewertet</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                  </td>
                  <td>{s.name}</td>
                  <td>{s.vorname}</td>
                  <td>{s.wohnort}</td>
                  <td>{s.tv}</td>
                  <td>{s.id}</td>
                  <td>{bewertungsMap[s.id] ? 'Ja' : 'Nein'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
