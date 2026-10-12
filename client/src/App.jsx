import { useEffect,useState } from 'react'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Menu,
  X,
  Users,
  MessageSquareText,
  Eye,
  Wrench,
  HeartHandshake,
  Leaf,
  MoveUpRight,
} from 'lucide-react'

import campusImage from './assets/images/campus.jpg'

const features = [
  {
    number: '01',
    icon: MessageSquareText,
    title: 'Report without the hassle.',
    description:
      'Submit campus complaints with the location, details, and supporting photos in one place.',
    color: 'bg-[#E8EFE4]',
  },
  {
    number: '02',
    icon: Eye,
    title: 'Know what happens next.',
    description:
      'Track when administration views your complaint and follow progress at every step.',
    color: 'bg-[#F0EBD9]',
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'Resolution you can trust.',
    description:
      'Repair evidence, administrative verification, and student confirmation close the loop.',
    color: 'bg-[#E8E8F0]',
  },
]

const workflow = [
  {
    number: '01',
    title: 'Raise an issue',
    description:
      'Tell us what happened and where the problem exists on campus.',
    icon: MessageSquareText,
  },
  {
    number: '02',
    title: 'Get it addressed',
    description:
      'The concerned department works on the issue and submits repair evidence.',
    icon: Wrench,
  },
  {
    number: '03',
    title: 'Confirm the outcome',
    description:
      'Administration verifies the work and students help confirm the resolution.',
    icon: CheckCircle2,
  },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  useEffect(() => {
    const scrollToSection = () => {
      const sectionId = decodeURIComponent(
        window.location.hash.slice(1)
      )

      if (!sectionId) return

      const section = document.getElementById(sectionId)

      if (section) {
        section.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }
    }

    const timer = setTimeout(scrollToSection, 100)

    window.addEventListener('hashchange', scrollToSection)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('hashchange', scrollToSection)
    }
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8F7F0] text-[#203B32]">
      {/* NAVBAR */}
      <header className="relative z-30 bg-[#F8F7F0]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-14">
          <a href="#home" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#244B3D] text-white shadow-md shadow-[#244B3D]/15">
              <Building2 size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                CampusFix
              </h1>
              <p className="mt-0.5 text-xs text-[#7C897E]">
                A better campus, together.
              </p>
            </div>
          </a>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-9 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-[#617167] transition hover:text-[#244B3D]"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#617167] transition hover:text-[#244B3D]"
            >
              How it works
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-[#617167] transition hover:text-[#244B3D]"
            >
              About us
            </a>
          </nav>

          {/* DESKTOP ACTION BUTTONS */}
          <div className="hidden items-center gap-4 md:flex">
            <a
              href="/login"
              className="px-3 py-3 text-sm font-semibold transition hover:text-[#64846A]"
            >
              Log in
            </a>

           <a
  href="/register"
  className="group flex items-center gap-3 rounded-full bg-[#244B3D] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#18382D]"
>
  Get started
  <ArrowRight
    size={16}
    className="transition group-hover:translate-x-1"
  />
</a>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="rounded-xl border border-[#DCE2D8] p-2.5 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* MOBILE NAVIGATION */}
        {menuOpen && (
          <nav className="absolute left-4 right-4 top-full rounded-2xl border border-[#E4E7DC] bg-white p-5 shadow-xl md:hidden">
            <a
              className="block rounded-xl px-3 py-3 hover:bg-[#F3F5EE]"
              href="#features"
              onClick={closeMenu}
            >
              Features
            </a>

            <a
              className="block rounded-xl px-3 py-3 hover:bg-[#F3F5EE]"
              href="#how-it-works"
              onClick={closeMenu}
            >
              How it works
            </a>

            <a
              className="block rounded-xl px-3 py-3 hover:bg-[#F3F5EE]"
              href="#about"
              onClick={closeMenu}
            >
              About us
            </a>

            {/* MOBILE LOGIN BUTTON */}
            <a
              className="mt-2 block rounded-xl px-3 py-3 font-semibold text-[#244B3D] hover:bg-[#F3F5EE]"
              href="/login"
              onClick={closeMenu}
            >
              Log in
            </a>

            {/* MOBILE GET STARTED BUTTON */}
            <a
              className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#244B3D] px-5 py-3 font-semibold text-white transition hover:bg-[#18382D]"
              href="/register"
              onClick={closeMenu}
            >
              Get started
              <ArrowRight size={17} />
            </a>
          </nav>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section
          id="home"
          className="relative isolate flex min-h-[620px] items-center overflow-hidden sm:min-h-[700px] lg:min-h-[730px]"
        >
          <img
            src={campusImage}
            alt="Our college campus surrounded by gardens and greenery"
            className="absolute inset-0 -z-20 h-full w-full scale-x-[-1] object-cover object-center"
          />

          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#142D23]/90 via-[#142D23]/55 to-[#142D23]/10" />

          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#142D23]/40 via-transparent to-[#142D23]/10" />

          <div className="mx-auto w-full max-w-[1440px] px-6 py-20 lg:px-14 lg:py-24">
            <div className="mr-auto max-w-3xl text-white">
              <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-medium text-[#E1EAD9] backdrop-blur-md">
                <Sparkles size={16} />
                Making campus life better, together
              </div>

              <h2 className="text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-[78px]">
                Our Campus.
                <br />
                Our Voice.
                <br />
                <span className="font-serif font-normal italic text-[#D5E0BE]">
                  Real Change.
                </span>
              </h2>

              <p className="mt-7 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
                See a problem? Speak up. Follow every update and help make
                sure the issues that affect our campus get properly resolved.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <a
                  href="/login"
                  className="group flex items-center gap-3 rounded-full bg-[#E6EBD9] px-7 py-4 font-semibold text-[#203B32] shadow-xl transition hover:-translate-y-1 hover:bg-white"
                >
                  Report a Problem
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                </a>

                <a
                  href="#how-it-works"
                  className="flex items-center gap-2 rounded-full border border-white/45 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  Discover how
                  <MoveUpRight size={17} />
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/90">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-[#D5E0BE]" />
                  Transparent updates
                </span>

                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-[#D5E0BE]" />
                  Verified resolutions
                </span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-7 right-7 hidden items-center gap-3 rounded-full border border-white/25 bg-[#142D23]/35 px-4 py-3 text-sm text-white/90 backdrop-blur-md lg:flex">
            <Leaf size={17} className="text-[#D5E0BE]" />
            Our campus. Our responsibility.
          </div>
        </section>

        {/* INTRO STRIP */}
        <section className="border-b border-[#E7E9E0] bg-[#F8F7F0] px-6 py-10 lg:px-14">
          <div className="mx-auto grid max-w-[1440px] gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8EFE4] text-[#41654B]">
                <Users size={22} />
              </div>

              <div>
                <h3 className="font-semibold">A shared responsibility</h3>
                <p className="mt-1 text-sm leading-6 text-[#718077]">
                  Students, staff, and administration working together.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0EBD9] text-[#8B7743]">
                <Eye size={22} />
              </div>

              <div>
                <h3 className="font-semibold">Transparent progress</h3>
                <p className="mt-1 text-sm leading-6 text-[#718077]">
                  Clear updates from the first report to final confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8E8F0] text-[#565B83]">
                <HeartHandshake size={22} />
              </div>

              <div>
                <h3 className="font-semibold">Accountable resolution</h3>
                <p className="mt-1 text-sm leading-6 text-[#718077]">
                  Repair evidence and confirmation help close the loop.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="bg-white px-6 py-24 lg:px-14 lg:py-28"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7A927B]">
                  Built around students
                </p>

                <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  Less chasing.
                  <br />
                  <span className="font-serif font-normal italic text-[#64846A]">
                    More resolving.
                  </span>
                </h2>
              </div>

              <p className="max-w-md leading-7 text-[#718077]">
                One transparent process connecting students, administration,
                and maintenance teams from the first report to the final outcome.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon

                return (
                  <article
                    key={feature.number}
                    className="group rounded-[28px] border border-[#E8EBE2] bg-[#FBFBF7] p-8 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#244B3D]/[0.08]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold tracking-widest text-[#92A08F]">
                        {feature.number}
                      </span>

                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} text-[#41654B] transition group-hover:bg-[#244B3D] group-hover:text-white`}
                      >
                        <Icon size={25} />
                      </div>
                    </div>

                    <h3 className="mt-8 text-2xl font-semibold tracking-tight">
                      {feature.title}
                    </h3>

                    <p className="mt-4 leading-7 text-[#718077]">
                      {feature.description}
                    </p>

                    <div className="mt-8 h-px bg-[#E6E9DF] transition group-hover:bg-[#9BAF96]" />
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how-it-works"
          className="bg-[#EEF0E6] px-6 py-24 lg:px-14 lg:py-28"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#718B72]">
                A clear process
              </p>

              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                From problem
                <br />
                <span className="font-serif font-normal italic text-[#64846A]">
                  to progress.
                </span>
              </h2>

              <p className="mt-5 max-w-xl leading-7 text-[#718077]">
                Every complaint follows a transparent path, so students
                know what is happening and who is responsible.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {workflow.map((step) => {
                const Icon = step.icon

                return (
                  <article
                    key={step.number}
                    className="relative rounded-[28px] border border-white bg-white/75 p-8 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#244B3D]/[0.05]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-5xl italic text-[#8CA187]">
                        {step.number}
                      </span>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EFE4] text-[#41654B]">
                        <Icon size={23} />
                      </div>
                    </div>

                    <h3 className="mt-7 text-xl font-semibold">
                      {step.title}
                    </h3>

                    <p className="mt-3 leading-7 text-[#718077]">
                      {step.description}
                    </p>
                  </article>
                )
              })}
            </div>

            <div className="mt-8 flex items-start gap-4 rounded-2xl border border-[#DDE6D8] bg-[#E5EBDD] p-6">
              <ShieldCheck
                size={24}
                className="mt-0.5 shrink-0 text-[#41654B]"
              />

              <p className="text-sm leading-7 text-[#526B57]">
                <strong>Our promise:</strong> Staff submitting repair evidence
                does not automatically close a complaint. Administration
                verifies the work, and student or community confirmation
                helps establish whether the issue has actually been resolved.
              </p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section
          id="about"
          className="bg-[#F8F7F0] px-6 py-24 lg:px-14 lg:py-28"
        >
          <div className="mx-auto max-w-[1440px]">
            <div className="relative overflow-hidden rounded-[34px] bg-[#244B3D] p-8 text-white sm:p-12 lg:p-16">
              <div className="pointer-events-none absolute -right-10 -top-24 h-72 w-72 rounded-full border border-white/10" />

              <div className="pointer-events-none absolute -right-2 -top-16 h-56 w-56 rounded-full border border-white/10" />

              <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  <p className="text-sm font-medium tracking-[0.2em] text-[#C8D9C2]">
                    BETTER CAMPUS, TOGETHER
                  </p>

                  <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                    Your voice can
                    <br />
                    make a difference.
                  </h2>

                  <p className="mt-5 max-w-xl leading-7 text-white/75">
                    Help create a campus where problems are heard,
                    progress is visible, and resolutions are verified.
                  </p>
                </div>

                <a
                  href="/login"
                  className="group flex shrink-0 items-center gap-3 rounded-full bg-[#F3F0E5] px-7 py-4 font-semibold text-[#244B3D] transition hover:-translate-y-1 hover:bg-white"
                >
                  Get started
                  <ArrowRight
                    size={18}
                    className="transition group-hover:translate-x-1"
                  />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#E7E9E0] bg-[#F8F7F0] px-6 py-8 lg:px-14">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <a href="#home" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#244B3D] text-white">
              <Building2 size={18} />
            </div>

            <span className="font-bold">CampusFix</span>
          </a>

          <p className="text-sm text-[#819087]">
            © 2026 CampusFix
          </p>

          <p className="text-sm text-[#819087]">
            Report responsibly. Resolve transparently.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App