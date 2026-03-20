import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQAccordion } from '@/components/landing/faq-accordion';

export const metadata: Metadata = {
  title: 'Catatan — Aplikasi Catatan yang Indah untuk Indonesia',
  description:
    'Tulis, organisir, dan simpan ide-idemu dengan editor yang cantik. Gratis, offline-first, dan tersedia di semua perangkat.',
  openGraph: {
    title: 'Catatan — Aplikasi Catatan yang Indah',
    description: 'Editor catatan yang simpel, cepat, dan cantik. Dibuat untuk Indonesia.',
    type: 'website',
    locale: 'id_ID',
  },
};

/* ---------- Inline SVG icon components ---------- */

function EditorIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 14H28M12 20H24M12 26H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function OfflineIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8C14 8 9 12 8 17.5C5 18.5 3 21 3 24C3 28 6 31 10 31H30C34 31 37 28 37 24C37 21 35 18.5 32 17.5C31 12 26 8 20 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 22L19 25L24 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="2" />
      <path d="M20 6V34" stroke="currentColor" strokeWidth="2" />
      <path d="M20 6C27.732 6 34 12.268 34 20C34 27.732 27.732 34 20 34" fill="currentColor" fillOpacity="0.15" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19L6 10C6 7.79086 7.79086 6 10 6H19L34 21L21 34L6 19Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="14" cy="14" r="3" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 9L7.5 12.5L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 5L13 13M13 5L5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Data ---------- */

const features = [
  {
    icon: <EditorIcon />,
    title: 'Editor yang Cantik',
    description: 'WYSIWYG editor seperti Medium — heading, list, checklist, code block, dan lainnya.',
  },
  {
    icon: <OfflineIcon />,
    title: 'Offline-First',
    description: 'Semua catatan disimpan lokal di perangkatmu. Tetap bisa menulis tanpa internet.',
  },
  {
    icon: <ThemeIcon />,
    title: 'Light & Dark Mode',
    description: 'Tema hangat yang nyaman di mata. Otomatis mengikuti sistem atau pilih sendiri.',
  },
  {
    icon: <TagIcon />,
    title: 'Organisir dengan Tag',
    description: 'Tag berwarna untuk mengelompokkan catatan. Cari dan filter dengan cepat.',
  },
];

const pricingFeatures = [
  { name: 'Catatan', free: '50 catatan', pro: 'Tak terbatas' },
  { name: 'Tag', free: '10 tag', pro: 'Tak terbatas' },
  { name: 'Editor lengkap', free: true, pro: true },
  { name: 'Offline mode', free: true, pro: true },
  { name: 'Light & dark mode', free: true, pro: true },
  { name: 'Cloud sync', free: false, pro: true },
  { name: 'Export (MD, PDF, HTML)', free: false, pro: true },
  { name: 'Upload gambar ke cloud', free: false, pro: true },
  { name: 'Font preset premium', free: false, pro: true },
  { name: 'Custom accent color', free: false, pro: true },
];

const faqs = [
  {
    question: 'Apakah Catatan benar-benar gratis?',
    answer: 'Ya! Paket Free sudah termasuk editor lengkap, 50 catatan, 10 tag, dark mode, dan offline support. Tidak perlu kartu kredit.',
  },
  {
    question: 'Apa bedanya Free dan Pro?',
    answer: 'Pro memberikan catatan tak terbatas, cloud sync antar perangkat, export ke Markdown/PDF/HTML, upload gambar ke cloud, dan fitur kustomisasi premium.',
  },
  {
    question: 'Bagaimana cara upgrade ke Pro?',
    answer: 'Kamu bisa upgrade langsung dari aplikasi melalui halaman Settings. Tersedia pembayaran via GoPay, OVO, DANA, ShopeePay, transfer bank, dan kartu kredit.',
  },
  {
    question: 'Apakah data saya aman?',
    answer: 'Catatan disimpan secara lokal di perangkatmu (IndexedDB). Untuk Pro, data juga tersimpan terenkripsi di cloud dengan Row Level Security.',
  },
  {
    question: 'Bisa dipakai di HP?',
    answer: 'Ya! Catatan adalah Progressive Web App (PWA) yang bisa di-install di HP, tablet, dan desktop. Tinggal buka di browser dan "Add to Home Screen".',
  },
  {
    question: 'Bagaimana jika saya cancel Pro?',
    answer: 'Kamu tetap bisa mengakses semua catatan hingga akhir periode berlangganan. Setelah itu, akun kembali ke Free dan catatan lokal tetap tersimpan.',
  },
];

/* ---------- Page Component ---------- */

export default function LandingPage() {
  return (
    <div className="font-landing min-h-screen bg-bg-primary text-text-primary">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <Link href="/" className="text-xl font-bold text-text-primary">
            Catatan
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-caption font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Masuk
            </Link>
            <Link
              href="/notes"
              className="rounded-lg bg-accent px-4 py-2 text-caption font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Mulai Menulis
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center lg:px-8 lg:pt-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-text-primary md:text-5xl lg:text-6xl">
          Tulis Ide-Idemu dengan{' '}
          <span className="text-accent">Indah</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary md:text-xl">
          Aplikasi catatan yang simpel, cepat, dan cantik. Offline-first, gratis, dan dibuat khusus untuk kamu.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/notes"
            className="inline-flex h-12 items-center rounded-xl bg-accent px-8 text-body-ui font-semibold text-white shadow-md transition-all hover:bg-accent-hover hover:shadow-lg"
          >
            Mulai Menulis — Gratis
          </Link>
          <a
            href="#pricing"
            className="inline-flex h-12 items-center rounded-xl border border-border px-8 text-body-ui font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            Lihat Harga
          </a>
        </div>

        {/* App mockup */}
        <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <span className="ml-3 text-caption text-text-muted">catatan.app</span>
          </div>
          <div className="p-8 text-left md:p-12">
            <div className="mb-6 text-2xl font-bold text-text-primary md:text-3xl">
              Ide Besar Dimulai dari Catatan Kecil
            </div>
            <div className="space-y-3 text-text-secondary">
              <p>Setiap cerita hebat dimulai dari satu kata. Setiap proyek besar dimulai dari satu ide yang ditulis di catatan.</p>
              <p className="flex items-center gap-2">
                <span className="inline-block h-5 w-5 rounded bg-accent/20 text-center text-xs leading-5 text-accent">&#10003;</span>
                Buat daftar tugas untuk hari ini
              </p>
              <p className="flex items-center gap-2">
                <span className="inline-block h-5 w-5 rounded bg-accent/20 text-center text-xs leading-5 text-accent">&#10003;</span>
                Tulis jurnal harian
              </p>
              <p className="text-text-muted">
                Simpan resep masakan favorit, catatan meeting, ide startup...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-text-primary md:text-4xl">
            Kenapa Catatan?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-body-ui text-text-secondary">
            Dibuat dengan fokus pada pengalaman menulis yang nyaman dan cepat.
          </p>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-bg-elevated p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 text-accent">{feature.icon}</div>
                <h3 className="text-body-ui font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-caption text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-text-primary md:text-4xl">
            Harga Simpel, Tanpa Kejutan
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-body-ui text-text-secondary">
            Mulai gratis, upgrade kapan saja.
          </p>
          <div className="mt-14 grid gap-6 md:grid-cols-2 md:gap-8 lg:mx-auto lg:max-w-4xl">
            {/* Free */}
            <div className="rounded-xl border border-border bg-bg-elevated p-8">
              <h3 className="text-body-ui font-semibold text-text-secondary">Free</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-text-primary">Rp 0</span>
                <span className="text-caption text-text-muted"> / selamanya</span>
              </div>
              <p className="mt-3 text-caption text-text-secondary">
                Semua yang kamu butuhkan untuk mulai menulis.
              </p>
              <Link
                href="/notes"
                className="mt-6 block rounded-lg border border-border py-3 text-center text-body-ui font-medium text-text-primary transition-colors hover:bg-bg-tertiary"
              >
                Mulai Gratis
              </Link>
              <ul className="mt-8 space-y-3">
                {pricingFeatures.map((f) => (
                  <li key={f.name} className="flex items-center gap-3 text-caption">
                    <span className={f.free ? 'text-green-500' : 'text-text-muted'}>
                      {f.free ? <CheckIcon /> : <XIcon />}
                    </span>
                    <span className={f.free ? 'text-text-secondary' : 'text-text-muted'}>
                      {f.name}
                      {typeof f.free === 'string' && (
                        <span className="ml-1 text-text-muted">({f.free})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="relative rounded-xl border-2 border-accent bg-bg-elevated p-8">
              <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-white">
                PALING POPULER
              </span>
              <h3 className="text-body-ui font-semibold text-accent">Pro</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold text-text-primary">Rp 39rb</span>
                <span className="text-caption text-text-muted"> / bulan</span>
              </div>
              <p className="mt-1 text-caption text-text-muted">
                atau Rp 349rb/tahun{' '}
                <span className="font-medium text-green-600">(hemat 25%)</span>
              </p>
              <p className="mt-3 text-caption text-text-secondary">
                Untuk penulis serius yang butuh lebih.
              </p>
              <Link
                href="/register"
                className="mt-6 block rounded-lg bg-accent py-3 text-center text-body-ui font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Coba 7 Hari Gratis
              </Link>
              <ul className="mt-8 space-y-3">
                {pricingFeatures.map((f) => (
                  <li key={f.name} className="flex items-center gap-3 text-caption">
                    <span className="text-green-500">
                      <CheckIcon />
                    </span>
                    <span className="text-text-secondary">
                      {f.name}
                      {typeof f.pro === 'string' && (
                        <span className="ml-1 text-text-muted">({f.pro})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-bg-secondary py-20">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-text-primary md:text-4xl">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <div className="mt-12">
            <FAQAccordion faqs={faqs} />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center lg:px-8">
          <h2 className="text-3xl font-bold text-text-primary md:text-4xl">
            Siap Mulai Menulis?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-body-ui text-text-secondary">
            Tidak perlu daftar. Langsung buka editor dan mulai menulis catatan pertamamu.
          </p>
          <Link
            href="/notes"
            className="mt-8 inline-flex h-12 items-center rounded-xl bg-accent px-8 text-body-ui font-semibold text-white shadow-md transition-all hover:bg-accent-hover hover:shadow-lg"
          >
            Mulai Menulis — Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-bg-secondary py-12">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-lg font-bold text-text-primary">Catatan</span>
              <p className="mt-3 text-caption text-text-muted">
                Aplikasi catatan yang indah dan simpel untuk menulis ide-idemu.
              </p>
            </div>
            <div>
              <h4 className="text-label font-semibold text-text-secondary">PRODUK</h4>
              <ul className="mt-3 space-y-2">
                <li><Link href="/notes" className="text-caption text-text-muted hover:text-text-primary">Editor</Link></li>
                <li><a href="#pricing" className="text-caption text-text-muted hover:text-text-primary">Harga</a></li>
                <li><Link href="/login" className="text-caption text-text-muted hover:text-text-primary">Masuk</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-label font-semibold text-text-secondary">DUKUNGAN</h4>
              <ul className="mt-3 space-y-2">
                <li><a href="#" className="text-caption text-text-muted hover:text-text-primary">Bantuan</a></li>
                <li><a href="#" className="text-caption text-text-muted hover:text-text-primary">Kontak</a></li>
                <li><a href="#" className="text-caption text-text-muted hover:text-text-primary">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-label font-semibold text-text-secondary">LEGAL</h4>
              <ul className="mt-3 space-y-2">
                <li><a href="#" className="text-caption text-text-muted hover:text-text-primary">Kebijakan Privasi</a></li>
                <li><a href="#" className="text-caption text-text-muted hover:text-text-primary">Syarat Layanan</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-caption text-text-muted">
            &copy; {new Date().getFullYear()} Catatan. Dibuat dengan cinta di Indonesia.
          </div>
        </div>
      </footer>
    </div>
  );
}
