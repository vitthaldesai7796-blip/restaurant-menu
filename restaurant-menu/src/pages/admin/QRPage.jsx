import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import QRCode from 'qrcode'
import { Download, Printer } from 'lucide-react'
import { Spinner } from '../../components/ui'
import { useToast } from '../../components/Toast'
import { isHttpUrl } from '../../lib/utils'

export default function QRPage() {
  const { settings } = useOutletContext()
  const toast = useToast()
  const [url, setUrl] = useState(`${window.location.origin}/`)
  const [png, setPng] = useState('')
  const valid = isHttpUrl(url.trim())
  const name = settings?.name || 'Our Menu'

  useEffect(() => {
    if (!valid) { setPng(''); return }
    let live = true
    QRCode.toDataURL(url.trim(), { width: 1024, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#0f2a26', light: '#ffffff' } })
      .then((d) => live && setPng(d)).catch(() => live && toast.error('Could not generate the QR code.'))
    return () => { live = false }
  }, [url, valid]) // eslint-disable-line react-hooks/exhaustive-deps

  const download = () => {
    const a = document.createElement('a')
    a.href = png
    a.download = `${name.replace(/[^\w]+/g, '-').toLowerCase()}-menu-qr.png`
    a.click()
  }

  const print = () => {
    const w = window.open('', '_blank')
    if (!w) return toast.error('Pop-up blocked. Allow pop-ups for this site, then try again.')
    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
    w.document.write(`<!doctype html><title>Menu QR</title><style>
      body{font-family:system-ui,sans-serif;text-align:center;margin:0;padding:48px}
      h1{font-size:34px;margin:0 0 8px}p{font-size:20px;color:#444;margin:6px 0 28px}
      img{width:420px;max-width:90%}small{display:block;margin-top:20px;color:#777;word-break:break-all}</style>
      <h1>${esc(name)}</h1><p>Scan to view our menu</p><img src="${png}" alt="QR code"><small>${esc(url.trim())}</small>`)
    w.document.close()
    w.onload = () => { w.focus(); w.print() }
  }

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-2xl font-semibold">QR code</h1>
      <div className="a-card space-y-4 p-5">
        <div><label className="a-label" htmlFor="qr-url">Menu link in the QR code</label>
          <input id="qr-url" className="a-input" value={url} onChange={(e) => setUrl(e.target.value)} />
          {!valid && <p className="a-err">Enter a full link starting with https://</p>}
          {valid && /localhost|127\.0\.0\.1/.test(url) && <p className="mt-1 text-xs text-amber-700">This is a local address. Open this page on your live website to get the real QR code.</p>}
          <p className="mt-1 text-xs text-slate-500">Defaults to this website’s address. Change it only if you later connect a custom domain.</p></div>
        <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-4">
          {png ? <img src={png} alt="Menu QR code" className="h-64 w-64" /> : <div className="flex h-64 w-64 items-center justify-center text-slate-400">{valid ? <Spinner size={28} /> : 'No QR code'}</div>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="a-btn-primary" onClick={download} disabled={!png}><Download size={16} />Download PNG</button>
          <button className="a-btn-ghost" onClick={print} disabled={!png}><Printer size={16} />Print</button>
        </div>
      </div>
    </div>
  )
}
